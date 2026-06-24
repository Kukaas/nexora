"use server";

import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";

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
