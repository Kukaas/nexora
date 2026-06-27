"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
