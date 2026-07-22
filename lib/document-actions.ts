"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isResidencyVerified } from "@/lib/profile";
import { deleteCloudinaryImage, uploadImage } from "@/lib/cloudinary";
import { emitInvalidate } from "@/lib/realtime/emit";
import { INVALIDATION_TOPICS } from "@/lib/query/keys";
import { generateVerificationCode } from "@/lib/verification";
import {
  DocumentRequestStatus,
  PaymentMethodType,
} from "@/app/generated/prisma/enums";
import {
  parseDocumentFields,
  type DocumentFieldValue,
} from "@/lib/documents";

export type SubmitResult =
  | { ok: true; referenceNumber: string }
  | { ok: false; error: string };

const MAX_PROOF_BYTES = 3 * 1024 * 1024;

const submitSchema = z.object({
  documentTypeId: z.string().min(1),
  // Optional: a free document (fee 0) has no payment step, so no method.
  method: z.enum(["GCASH", "MAYA", "CASH"]).optional(),
  paymentReference: z.string().trim().max(80).optional(),
  purpose: z.string().trim().max(300).optional(),
});

/**
 * A resident submits a document request. The request carries its own payment
 * (method, reference, proof screenshot) and starts at PENDING for the secretary
 * to verify. The document name and fee are snapshotted from the catalog so a
 * later price change never rewrites this request. Takes `FormData` because of
 * the proof-image upload.
 */
export async function submitDocumentRequest(
  formData: FormData,
): Promise<SubmitResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }
  if (!(await isResidencyVerified(session.user.id))) {
    return {
      ok: false,
      error: "Your account is still being verified. You can request documents once it's approved.",
    };
  }

  const parsed = submitSchema.safeParse({
    documentTypeId: formData.get("documentTypeId"),
    method: formData.get("method") ?? undefined,
    paymentReference: emptyToUndefined(formData.get("paymentReference")),
    purpose: emptyToUndefined(formData.get("purpose")),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check your request and try again." };
  }
  const { documentTypeId, method, paymentReference, purpose } = parsed.data;

  // The chosen document type must still exist and be active.
  const docType = await prisma.documentType.findUnique({
    where: { id: documentTypeId },
    select: { id: true, name: true, fee: true, active: true, fields: true },
  });
  if (!docType || !docType.active) {
    return {
      ok: false,
      error: "That document isn't available to request right now.",
    };
  }

  // Collect the resident's answers to the document's custom fields. The form
  // sends them as a JSON object keyed by field id; we validate each against the
  // catalog definition (required, valid dropdown choice) and snapshot the
  // label/type/value onto the request so later edits never rewrite it.
  const answers = readFieldAnswers(formData.get("fields"));
  const fields = parseDocumentFields(docType.fields);
  const fieldValues: DocumentFieldValue[] = [];
  for (const field of fields) {
    const value = (answers[field.id] ?? "").trim();
    if (field.required && !value) {
      return { ok: false, error: `Please fill in "${field.label}".` };
    }
    if (
      value &&
      field.type === "select" &&
      field.options.length > 0 &&
      !field.options.includes(value)
    ) {
      return { ok: false, error: `Choose a valid option for "${field.label}".` };
    }
    fieldValues.push({ label: field.label, type: field.type, value });
  }

  // A free document has no payment step at all: no method to pick, no channel to
  // check, no reference or proof. We still store a method because the column is
  // required, defaulting to CASH; the detail views key off the fee, not this
  // field. A paid document goes through the full payment validation below.
  const isFree = Number(docType.fee) <= 0;
  let methodType: PaymentMethodType = PaymentMethodType.CASH;
  let storedReference: string | null = null;
  let proofImage: string | null = null;

  if (!isFree) {
    if (!method) {
      return { ok: false, error: "Choose how you'll pay." };
    }
    methodType = method as PaymentMethodType;
    const isEwallet = methodType !== PaymentMethodType.CASH;

    // The channel must be one the treasurer has turned on.
    const channel = await prisma.paymentMethod.findUnique({
      where: { type: methodType },
      select: { enabled: true },
    });
    if (!channel?.enabled) {
      return {
        ok: false,
        error: "That payment method isn't available right now.",
      };
    }

    // E-wallet payments need a reference number and a screenshot as proof; cash
    // is settled in person at the hall, so it carries neither.
    if (isEwallet) {
      if (!paymentReference) {
        return {
          ok: false,
          error: "Enter the reference number from your payment.",
        };
      }
      const file = formData.get("proof");
      if (!(file instanceof File) || file.size === 0) {
        return { ok: false, error: "Attach a screenshot of your payment." };
      }
      if (!file.type.startsWith("image/")) {
        return { ok: false, error: "The proof must be an image file." };
      }
      if (file.size > MAX_PROOF_BYTES) {
        return { ok: false, error: "That image is too large. Keep it under 3 MB." };
      }
      try {
        proofImage = await uploadImage(file, "nexora/document-proof");
      } catch (error) {
        console.error("Proof upload failed", error);
        return {
          ok: false,
          error: "We couldn't upload your screenshot. Try again in a moment.",
        };
      }
      storedReference = paymentReference;
    }
  }

  const user = session.user as {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email: string;
  };
  const requesterName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.name?.trim() ||
    user.email;

  const referenceNumber = await uniqueReference();
  const verificationCode = await generateVerificationCode();

  await prisma.documentRequest.create({
    data: {
      referenceNumber,
      verificationCode,
      documentTypeId: docType.id,
      documentName: docType.name,
      fee: docType.fee,
      purpose: purpose ?? null,
      method: methodType,
      paymentReference: storedReference,
      proofImage,
      fieldValues,
      requesterId: user.id,
      requesterName,
    },
  });

  emitInvalidate(INVALIDATION_TOPICS.residentRequests, { toUser: user.id });
  emitInvalidate(INVALIDATION_TOPICS.officialsRequests, { toOfficials: true });
  revalidatePath(`/resident/${user.id}`);
  return { ok: true, referenceNumber };
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

const updateSchema = z.object({
  requestId: z.string().min(1),
  method: z.enum(["GCASH", "MAYA", "CASH"]).optional(),
  paymentReference: z.string().trim().max(80).optional(),
  purpose: z.string().trim().max(300).optional(),
  // The resident's reply when resubmitting a rejected request.
  resubmitNote: z.string().trim().max(500).optional(),
});

/**
 * A resident edits one of their own requests while it's still PENDING (awaiting
 * verification) or REJECTED (sent back). They can change the purpose, the custom
 * field answers, and the payment. Editing resubmits it: the request returns to
 * PENDING and any rejection note is cleared. The fee and document name stay the
 * snapshot from when it was first requested.
 */
export async function updateDocumentRequest(
  formData: FormData,
): Promise<UpdateResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }
  if (!(await isResidencyVerified(session.user.id))) {
    return {
      ok: false,
      error: "Your account is still being verified.",
    };
  }

  const parsed = updateSchema.safeParse({
    requestId: formData.get("requestId"),
    method: formData.get("method") ?? undefined,
    paymentReference: emptyToUndefined(formData.get("paymentReference")),
    purpose: emptyToUndefined(formData.get("purpose")),
    resubmitNote: emptyToUndefined(formData.get("resubmitNote")),
  });
  if (!parsed.success) {
    return { ok: false, error: "Please check your request and try again." };
  }
  const { requestId, method, paymentReference, purpose, resubmitNote } =
    parsed.data;

  // The request must exist, belong to the resident, and still be editable.
  const existing = await prisma.documentRequest.findFirst({
    where: { id: requestId, requesterId: session.user.id },
    select: {
      id: true,
      fee: true,
      status: true,
      documentTypeId: true,
      proofImage: true,
    },
  });
  if (!existing) {
    return { ok: false, error: "That request no longer exists." };
  }
  if (
    existing.status !== DocumentRequestStatus.PENDING &&
    existing.status !== DocumentRequestStatus.REJECTED
  ) {
    return {
      ok: false,
      error: "This request is already being processed and can't be edited.",
    };
  }
  // The resident's reply only applies when they're fixing a rejected request.
  const wasRejected = existing.status === DocumentRequestStatus.REJECTED;

  // Validate the custom field answers against the document's current fields.
  const answers = readFieldAnswers(formData.get("fields"));
  const docType = existing.documentTypeId
    ? await prisma.documentType.findUnique({
        where: { id: existing.documentTypeId },
        select: { fields: true },
      })
    : null;
  const fields = parseDocumentFields(docType?.fields);
  const fieldValues: DocumentFieldValue[] = [];
  for (const field of fields) {
    const value = (answers[field.id] ?? "").trim();
    if (field.required && !value) {
      return { ok: false, error: `Please fill in "${field.label}".` };
    }
    if (
      value &&
      field.type === "select" &&
      field.options.length > 0 &&
      !field.options.includes(value)
    ) {
      return { ok: false, error: `Choose a valid option for "${field.label}".` };
    }
    fieldValues.push({ label: field.label, type: field.type, value });
  }

  // Fee is the snapshot from the original request, so a later price change never
  // rewrites what the resident owes here.
  const isFree = Number(existing.fee) <= 0;
  let methodType: PaymentMethodType = PaymentMethodType.CASH;
  let storedReference: string | null = null;
  let proofImage: string | null = existing.proofImage;

  if (!isFree) {
    if (!method) {
      return { ok: false, error: "Choose how you'll pay." };
    }
    methodType = method as PaymentMethodType;
    const isEwallet = methodType !== PaymentMethodType.CASH;

    const channel = await prisma.paymentMethod.findUnique({
      where: { type: methodType },
      select: { enabled: true },
    });
    if (!channel?.enabled) {
      return {
        ok: false,
        error: "That payment method isn't available right now.",
      };
    }

    if (isEwallet) {
      if (!paymentReference) {
        return {
          ok: false,
          error: "Enter the reference number from your payment.",
        };
      }
      // A new screenshot replaces the old one; with none attached we keep the
      // proof already on file, so they don't have to re-upload an unchanged one.
      const file = formData.get("proof");
      if (file instanceof File && file.size > 0) {
        if (!file.type.startsWith("image/")) {
          return { ok: false, error: "The proof must be an image file." };
        }
        if (file.size > MAX_PROOF_BYTES) {
          return {
            ok: false,
            error: "That image is too large. Keep it under 3 MB.",
          };
        }
        try {
          proofImage = await uploadImage(file, "nexora/document-proof");
        } catch (error) {
          console.error("Proof upload failed", error);
          return {
            ok: false,
            error: "We couldn't upload your screenshot. Try again in a moment.",
          };
        }
      } else if (!proofImage) {
        return { ok: false, error: "Attach a screenshot of your payment." };
      }
      storedReference = paymentReference;
    } else {
      // Switched to cash: it's settled in person, so drop e-wallet artifacts.
      storedReference = null;
      proofImage = null;
    }
  } else {
    storedReference = null;
    proofImage = null;
  }

  await prisma.documentRequest.update({
    where: { id: existing.id },
    data: {
      purpose: purpose ?? null,
      fieldValues,
      method: methodType,
      paymentReference: storedReference,
      proofImage,
      // Resubmitted for verification: back to PENDING, rejection cleared. Keep
      // the resident's reply only when they were actually fixing a rejection.
      status: DocumentRequestStatus.PENDING,
      note: null,
      resubmitNote: wasRejected ? (resubmitNote ?? null) : null,
      reviewedAt: null,
      reviewedById: null,
    },
  });

  // The old screenshot is now unreferenced (replaced with a new one, or dropped
  // when switching to cash/free) — clean it up. Best-effort; never blocks.
  if (existing.proofImage && existing.proofImage !== proofImage) {
    await deleteCloudinaryImage(existing.proofImage);
  }

  emitInvalidate(INVALIDATION_TOPICS.residentRequests, {
    toUser: session.user.id,
  });
  emitInvalidate(INVALIDATION_TOPICS.officialsRequests, { toOfficials: true });
  revalidatePath(`/resident/${session.user.id}`);
  revalidatePath(`/resident/${session.user.id}/requests`);
  revalidatePath(`/resident/${session.user.id}/requests/${existing.id}`);
  return { ok: true };
}

/**
 * A short, human-readable reference like `BRGY-2026-04217`. Retries on the rare
 * chance two residents draw the same random suffix in the same year.
 */
async function uniqueReference(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = String(Math.floor(10000 + Math.random() * 90000));
    const candidate = `BRGY-${year}-${suffix}`;
    const taken = await prisma.documentRequest.findUnique({
      where: { referenceNumber: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  // Astronomically unlikely fallback: timestamp-based, still unique-by-time.
  return `BRGY-${year}-${Date.now().toString().slice(-6)}`;
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

/**
 * Parse the custom-field answers the resident form sends as a JSON object keyed
 * by field id. Anything malformed is treated as no answers given.
 */
function readFieldAnswers(raw: FormDataEntryValue | null): Record<string, string> {
  if (typeof raw !== "string" || !raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const answers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") answers[key] = value;
    }
    return answers;
  } catch {
    return {};
  }
}
