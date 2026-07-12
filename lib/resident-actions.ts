"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImage, uploadImage } from "@/lib/cloudinary";
import { IDType } from "@/app/generated/prisma/enums";

const ID_TYPE_VALUES = Object.values(IDType) as [IDType, ...IDType[]];

const setupSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  birthDate: z.string().min(1, "Select your date of birth."),
  mobileNumber: z.string().trim().min(1, "Enter your mobile number."),
  idType: z.enum(ID_TYPE_VALUES, { message: "Choose your ID type." }),
  idNumber: z.string().trim().min(1, "Enter your ID number.").max(60),
  idImage: z.string().url("Upload a photo of your ID."),
});

export type SetupInput = z.input<typeof setupSchema>;

export type SetupResult = { ok: true } | { ok: false; error: string };

const MAX_ID_IMAGE_BYTES = 10 * 1024 * 1024;

/** Upload a resident-selected ID image through the authenticated server. */
export async function uploadResidentIdImage(formData: FormData): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an ID photo to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "That file isn't an image." };
  }
  if (file.size > MAX_ID_IMAGE_BYTES) {
    return { ok: false, error: "Keep the ID photo under 10 MB." };
  }

  try {
    const url = await uploadImage(file, "nexora/government_id");
    return { ok: true, url };
  } catch (error) {
    console.error("uploadResidentIdImage failed", error);
    return { ok: false, error: "The ID photo couldn't be uploaded. Try again." };
  }
}

/**
 * Normalize a Philippine mobile number to `+63XXXXXXXXXX`. Accepts the common
 * forms residents type: `09XXXXXXXXX`, `+639XXXXXXXXX`, `639XXXXXXXXX`, with or
 * without spaces/dashes. Returns null when it isn't a valid PH mobile.
 */
function normalizePhMobile(raw: string): string | null {
  const digits = raw.replace(/[\s-()]/g, "");
  let local: string | null = null;
  if (/^09\d{9}$/.test(digits)) local = digits.slice(1); // drop leading 0
  else if (/^\+?639\d{8}$/.test(digits)) local = digits.replace(/^\+?63/, "");
  if (!local) return null;
  return `+63${local}`;
}

/**
 * Persist the resident's verification profile and mark setup complete. Saving
 * `profileCompletedAt` is what lets them past the /setup gate into /resident;
 * the submitted ID then awaits official verification.
 */
export async function completeResidentSetup(
  input: SetupInput,
): Promise<SetupResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }
  const data = parsed.data;

  const birthDate = new Date(data.birthDate);
  if (Number.isNaN(birthDate.getTime())) {
    return { ok: false, error: "Enter a valid date of birth." };
  }
  if (birthDate > new Date()) {
    return { ok: false, error: "Date of birth can't be in the future." };
  }

  const mobile = normalizePhMobile(data.mobileNumber);
  if (!mobile) {
    return { ok: false, error: "Enter a valid PH mobile number, e.g. 0917 123 4567." };
  }

  const middleName = data.middleName?.trim() || null;
  const fullName = [data.firstName, middleName, data.lastName]
    .filter(Boolean)
    .join(" ");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          firstName: data.firstName,
          middleName,
          lastName: data.lastName,
          name: fullName,
          birthDate,
          mobileNumber: mobile,
          profileCompletedAt: new Date(),
        },
      });

      await tx.iD.create({
        data: {
          type: data.idType,
          number: data.idNumber,
          image: data.idImage,
          userId: session.user.id,
        },
      });
    });

    return { ok: true };
  } catch (error) {
    // Unique constraint on [type, number]: this ID is already registered.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "That ID is already registered. Use a different ID or contact the barangay.",
      };
    }
    console.error("completeResidentSetup failed", error);
    return { ok: false, error: "Something went wrong saving your details. Please try again." };
  }
}

const resubmitIdSchema = z.object({
  idType: z.enum(ID_TYPE_VALUES, { message: "Choose your ID type." }),
  idNumber: z.string().trim().min(1, "Enter your ID number.").max(60),
  idImage: z.string().url("Upload a photo of your ID."),
});

export type ResubmitIdInput = z.input<typeof resubmitIdSchema>;
export type ResubmitIdResult = { ok: true } | { ok: false; error: string };

/**
 * Replace the ID a resident submitted, sending them back into review. Used when
 * an official rejected the previous one. We delete the old ID record(s) and
 * upload, then create a fresh ID that defaults to PENDING — so the resident is
 * no longer verified and an official reviews the new submission. Removing the
 * old row also frees the unique [type, number] slot in case they reuse it.
 */
export async function resubmitResidentId(
  input: ResubmitIdInput,
): Promise<ResubmitIdResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const parsed = resubmitIdSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your details and try again.",
    };
  }
  const data = parsed.data;

  // The IDs we're replacing — kept so we can delete their uploaded photos after
  // the swap succeeds.
  const oldIds = await prisma.iD.findMany({
    where: { userId: session.user.id },
    select: { image: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.iD.deleteMany({ where: { userId: session.user.id } });
      await tx.iD.create({
        data: {
          type: data.idType,
          number: data.idNumber,
          image: data.idImage,
          userId: session.user.id,
        },
      });
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error: "That ID is already registered. Use a different ID or contact the barangay.",
      };
    }
    console.error("resubmitResidentId failed", error);
    return { ok: false, error: "Something went wrong saving your ID. Please try again." };
  }

  // Best-effort cleanup of the old photos now that the new one is saved.
  for (const old of oldIds) {
    if (old.image && old.image !== data.idImage) {
      await deleteCloudinaryImage(old.image);
    }
  }

  revalidatePath(`/resident/${session.user.id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/activity");

  return { ok: true };
}
