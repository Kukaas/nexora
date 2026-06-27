"use server";

import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type RegisterResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Resident registration. Only email + password are collected here — the
 * remaining profile details (name, IDs, role specifics) are captured later in
 * the resident setup flow. Better Auth requires a `name`, so we pass an empty
 * placeholder that setup will overwrite.
 *
 * On success, Better Auth sends a confirmation email (see `emailVerification`
 * in `lib/auth.ts`); the resident can't sign in until they confirm.
 */
export async function registerResident(
  input: z.infer<typeof registerSchema>,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;

  // Reject an email that's already taken, with a message tailored to whichever
  // method owns it. We have to check this ourselves: with
  // `requireEmailVerification` on, Better Auth's signUpEmail intentionally
  // returns a *fake* success for an existing email (anti-enumeration) instead
  // of erroring, so a catch block alone would never see the duplicate.
  const existing = await findExistingMethod(email);
  if (existing === "google") {
    return {
      ok: false,
      error:
        'This email is already registered with Google. Use "Continue with Google" to sign in.',
    };
  }
  if (existing === "password") {
    return {
      ok: false,
      error:
        "This email is already registered. Sign in with your email and password instead.",
    };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: "",
        email,
        password,
      },
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof APIError) {
      return { ok: false, error: error.message };
    }
    console.error("registerResident failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Which sign-in method, if any, already owns this email. "google" when a Google
 * account is linked, "password" for any other existing user, null when the
 * email is free. Better Auth stores emails lowercased, so we normalize.
 */
async function findExistingMethod(
  email: string,
): Promise<"google" | "password" | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { accounts: { select: { providerId: true } } },
    });
    if (!user) return null;
    return user.accounts.some((a) => a.providerId === "google")
      ? "google"
      : "password";
  } catch (error) {
    // On a lookup failure, don't block registration — let signUpEmail decide.
    console.error("findExistingMethod lookup failed", error);
    return null;
  }
}
