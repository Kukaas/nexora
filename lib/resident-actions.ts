"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImage, uploadImage } from "@/lib/cloudinary";
import { IDStatus, IDType, Purok } from "@/app/generated/prisma/enums";

const ID_TYPE_VALUES = Object.values(IDType) as [IDType, ...IDType[]];
const PUROK_VALUES = Object.values(Purok) as [Purok, ...Purok[]];

const setupSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  birthDate: z.string().min(1, "Select your date of birth."),
  mobileNumber: z.string().trim().min(1, "Enter your mobile number."),
  purok: z.enum(PUROK_VALUES, { message: "Choose your purok." }),
  idType: z.enum(ID_TYPE_VALUES, { message: "Choose your ID type." }),
  idNumber: z.string().trim().min(1, "Enter your ID number.").max(60),
  idFront: z.string().url("Upload the front of your ID."),
  idBack: z.string().url("Upload the back of your ID."),
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
          purok: data.purok,
          profileCompletedAt: new Date(),
        },
      });

      await tx.iD.create({
        data: {
          type: data.idType,
          number: data.idNumber,
          frontImage: data.idFront,
          backImage: data.idBack,
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
  idFront: z.string().url("Upload the front of your ID."),
  idBack: z.string().url("Upload the back of your ID."),
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
    select: { frontImage: true, backImage: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.iD.deleteMany({ where: { userId: session.user.id } });
      await tx.iD.create({
        data: {
          type: data.idType,
          number: data.idNumber,
          frontImage: data.idFront,
          backImage: data.idBack,
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
    for (const url of [old.frontImage, old.backImage]) {
      if (url && url !== data.idFront && url !== data.idBack) {
        await deleteCloudinaryImage(url);
      }
    }
  }

  revalidatePath(`/resident/${session.user.id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/activity");

  return { ok: true };
}

// ── Profile self-service ─────────────────────────────────────────────────────
//
// A verified resident can edit their own profile from /resident/[id]/profile.
// Two of those edits touch verification: replacing the government ID, and
// changing the legal name on file. Both send the account back to PENDING so an
// official re-checks that the name and the ID still match, which also pauses new
// document requests (getResidencyStatus reads the latest ID's status).

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/** Upload a resident-chosen profile photo through the authenticated server. */
export async function uploadResidentAvatarImage(formData: FormData): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "That file isn't an image." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Keep the photo under 5 MB." };
  }

  try {
    const url = await uploadImage(file, "nexora/avatars");
    return { ok: true, url };
  } catch (error) {
    console.error("uploadResidentAvatarImage failed", error);
    return { ok: false, error: "The photo couldn't be uploaded. Try again." };
  }
}

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(80),
  middleName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().min(1, "Enter your last name.").max(80),
  birthDate: z.string().min(1, "Select your date of birth."),
  mobileNumber: z.string().trim().min(1, "Enter your mobile number."),
  purok: z.enum(PUROK_VALUES, { message: "Choose your purok." }),
  // Cloudinary URL of a newly uploaded avatar, or null to remove it. Omit to
  // leave the current photo untouched.
  image: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type UpdateProfileResult =
  | { ok: true; reverified: boolean }
  | { ok: false; error: string };

/** Normalize an optional name part for comparison ("" and undefined are equal). */
function nameKey(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/**
 * Save edits to the resident's own personal details (and optional avatar). When
 * the legal name changes we flip the current ID back to PENDING so an official
 * re-verifies it, which is why the caller warns before submitting.
 */
export async function updateResidentProfile(
  input: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your details and try again.",
    };
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

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      image: true,
      ids: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true },
      },
    },
  });
  if (!current) return { ok: false, error: "We couldn't find your account." };

  const middleName = data.middleName?.trim() || null;
  const fullName = [data.firstName, middleName, data.lastName]
    .filter(Boolean)
    .join(" ");

  const legalNameChanged =
    nameKey(current.firstName) !== nameKey(data.firstName) ||
    nameKey(current.middleName) !== nameKey(middleName) ||
    nameKey(current.lastName) !== nameKey(data.lastName);

  // Only re-verify when the name change lands on an ID that was already reviewed;
  // an ID still pending is on its way to review regardless.
  const latestId = current.ids[0];
  const reverify =
    legalNameChanged &&
    Boolean(latestId) &&
    latestId.status !== IDStatus.PENDING;

  const avatarChanged =
    data.image !== undefined && data.image !== current.image;
  const oldAvatar = current.image;

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
        purok: data.purok,
        ...(data.image !== undefined ? { image: data.image } : {}),
      },
    });

    if (reverify) {
      await tx.iD.update({
        where: { id: latestId.id },
        data: { status: IDStatus.PENDING, reviewedAt: null },
      });
    }
  });

  // Drop the previous avatar once the new one is saved (best-effort).
  if (avatarChanged && oldAvatar && oldAvatar !== data.image) {
    await deleteCloudinaryImage(oldAvatar);
  }

  revalidatePath(`/resident/${session.user.id}`);
  revalidatePath(`/resident/${session.user.id}/profile`);
  revalidatePath("/admin/residents");

  return { ok: true, reverified: reverify };
}

const changeIdSchema = z.object({
  idType: z.enum(ID_TYPE_VALUES, { message: "Choose your ID type." }),
  idNumber: z.string().trim().min(1, "Enter your ID number.").max(60),
  idFront: z.string().url("Upload the front of your ID."),
  idBack: z.string().url("Upload the back of your ID."),
});

export type ChangeIdInput = z.input<typeof changeIdSchema>;
export type ChangeIdResult = { ok: true } | { ok: false; error: string };

/**
 * Replace the government ID from the resident's own profile. Same swap as
 * resubmission (delete the old ID rows, create a fresh PENDING one, free the
 * unique [type, number] slot), but reachable while verified, so it always drops
 * the resident back into review. The caller confirms before calling this.
 */
export async function changeResidentId(
  input: ChangeIdInput,
): Promise<ChangeIdResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const parsed = changeIdSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check your details and try again.",
    };
  }
  const data = parsed.data;

  const oldIds = await prisma.iD.findMany({
    where: { userId: session.user.id },
    select: { frontImage: true, backImage: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      await tx.iD.deleteMany({ where: { userId: session.user.id } });
      await tx.iD.create({
        data: {
          type: data.idType,
          number: data.idNumber,
          frontImage: data.idFront,
          backImage: data.idBack,
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
    console.error("changeResidentId failed", error);
    return { ok: false, error: "Something went wrong saving your ID. Please try again." };
  }

  for (const old of oldIds) {
    for (const url of [old.frontImage, old.backImage]) {
      if (url && url !== data.idFront && url !== data.idBack) {
        await deleteCloudinaryImage(url);
      }
    }
  }

  revalidatePath(`/resident/${session.user.id}`);
  revalidatePath(`/resident/${session.user.id}/profile`);
  revalidatePath("/admin/residents");

  return { ok: true };
}
