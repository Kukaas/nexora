"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasAccess } from "@/lib/roles";
import { uploadImage } from "@/lib/cloudinary";
import {
  DocumentRequestStatus,
  PaymentMethodType,
  PaymentStatus,
  UserRoles,
} from "@/app/generated/prisma/enums";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Confirm the caller may act as treasurer (the treasurer themselves, or an
 * admin). Returns the acting user's id on success, or an error result.
 */
async function requireTreasurer(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session has expired. Sign in again." };
  const roles = session.user.roles as UserRoles[] | undefined;
  if (!hasAccess(roles, UserRoles.TREASURER)) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return { ok: true, userId: session.user.id };
}

const reviewSchema = z.object({
  paymentId: z.string().min(1),
  decision: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});

/**
 * Approve or reject a resident's payment. Rejecting requires a reason so the
 * resident is told what to fix. Re-reviewing an already-decided payment is
 * allowed (a treasurer can correct a mistake); we just re-stamp the reviewer.
 */
export async function reviewPayment(
  input: z.infer<typeof reviewSchema>,
): Promise<ActionResult> {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth;

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Something looked off with that request. Try again." };
  }
  const { paymentId, decision, note } = parsed.data;

  if (decision === "REJECTED" && !note) {
    return { ok: false, error: "Add a short reason so the resident knows what to fix." };
  }

  const existing = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "That payment no longer exists." };

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status:
        decision === "VERIFIED" ? PaymentStatus.VERIFIED : PaymentStatus.REJECTED,
      reviewNote: note || null,
      reviewedById: auth.userId,
      reviewedAt: new Date(),
    },
  });

  revalidatePath(`/treasurer/${auth.userId}`);
  return { ok: true };
}

const reviewDocumentSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(["VERIFIED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
  // The Official Receipt number, recorded when verifying a paid request.
  orNumber: z.string().trim().max(80).optional(),
});

/**
 * Verify or reject the payment attached to a document request. Verifying moves
 * the request into PROCESSING and hands it to the secretary to prepare and
 * release the document; rejecting sends it back to the resident with a required
 * reason. Payment verification is the treasurer's call alone — the secretary
 * never touches it.
 */
export async function reviewDocumentRequest(
  input: z.infer<typeof reviewDocumentSchema>,
): Promise<ActionResult> {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth;

  const parsed = reviewDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Something looked off with that request. Try again." };
  }
  const { requestId, decision, note, orNumber } = parsed.data;

  if (decision === "REJECTED" && !note) {
    return { ok: false, error: "Add a short reason so the resident knows what to fix." };
  }

  const existing = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    select: { id: true, fee: true },
  });
  if (!existing) return { ok: false, error: "That request no longer exists." };

  // Paid requests need an OR number on the books before they're verified; free
  // documents have nothing to receipt.
  const isPaid = Number(existing.fee) > 0;
  if (decision === "VERIFIED" && isPaid && !orNumber) {
    return { ok: false, error: "Enter the OR number to verify this payment." };
  }

  await prisma.documentRequest.update({
    where: { id: requestId },
    data: {
      status:
        decision === "VERIFIED"
          ? DocumentRequestStatus.PROCESSING
          : DocumentRequestStatus.REJECTED,
      note: decision === "REJECTED" ? note : null,
      orNumber: decision === "VERIFIED" ? (orNumber ?? null) : null,
      reviewedById: auth.userId,
      reviewedAt: new Date(),
      // Clear any prior release stamp if a READY request is sent back.
      releasedAt: null,
    },
  });

  revalidatePath(`/treasurer/${auth.userId}/payments`);
  revalidatePath(`/treasurer/${auth.userId}`);
  // The secretary's queue keys off PROCESSING, so refresh their console too.
  revalidatePath("/secretary", "layout");
  return { ok: true };
}

const methodSchema = z.object({
  type: z.enum(["GCASH", "MAYA", "CASH"]),
  enabled: z.boolean(),
  accountName: z.string().trim().max(120).optional(),
  accountNumber: z.string().trim().max(60).optional(),
  instructions: z.string().trim().max(500).optional(),
});

const MAX_QR_BYTES = 5 * 1024 * 1024;

/**
 * Create or update a payment channel. E-wallet channels (GCash / Maya) can carry
 * a QR image, account name, and account number; cash carries instructions only.
 * The QR file is uploaded to Cloudinary server-side; when no new file is sent we
 * keep the existing image. Takes `FormData` because of the file upload.
 */
export async function savePaymentMethod(
  formData: FormData,
): Promise<ActionResult> {
  const auth = await requireTreasurer();
  if (!auth.ok) return auth;

  const parsed = methodSchema.safeParse({
    type: formData.get("type"),
    enabled: formData.get("enabled") === "true",
    accountName: emptyToUndefined(formData.get("accountName")),
    accountNumber: emptyToUndefined(formData.get("accountNumber")),
    instructions: emptyToUndefined(formData.get("instructions")),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check the details and try again." };
  }
  const { type, enabled, accountName, accountNumber, instructions } = parsed.data;
  const methodType = type as PaymentMethodType;
  const isEwallet = methodType !== PaymentMethodType.CASH;

  // An e-wallet channel can't be turned on without the details a resident needs
  // to pay: an account name/number and a scannable QR.
  let qrImage: string | undefined;
  if (isEwallet) {
    const file = formData.get("qr");
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return { ok: false, error: "The QR code must be an image file." };
      }
      if (file.size > MAX_QR_BYTES) {
        return { ok: false, error: "That image is too large. Keep it under 5 MB." };
      }
      try {
        qrImage = await uploadImage(file, "nexora/payment-qr");
      } catch (error) {
        console.error("QR upload failed", error);
        return {
          ok: false,
          error: "We couldn't upload that QR image. Try again in a moment.",
        };
      }
    }

    const existing = await prisma.paymentMethod.findUnique({
      where: { type: methodType },
      select: { qrImage: true },
    });
    const effectiveQr = qrImage ?? existing?.qrImage ?? null;

    if (enabled && (!accountName || !accountNumber || !effectiveQr)) {
      return {
        ok: false,
        error:
          "Add the account name, number, and a QR code before turning this channel on.",
      };
    }
  }

  await prisma.paymentMethod.upsert({
    where: { type: methodType },
    update: {
      enabled,
      accountName: isEwallet ? accountName ?? null : null,
      accountNumber: isEwallet ? accountNumber ?? null : null,
      instructions: instructions ?? null,
      ...(qrImage ? { qrImage } : {}),
      updatedById: auth.userId,
    },
    create: {
      type: methodType,
      enabled,
      accountName: isEwallet ? accountName ?? null : null,
      accountNumber: isEwallet ? accountNumber ?? null : null,
      instructions: instructions ?? null,
      qrImage: qrImage ?? null,
      updatedById: auth.userId,
    },
  });

  revalidatePath(`/treasurer/${auth.userId}/methods`);
  return { ok: true };
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}
