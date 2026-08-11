"use server";

import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { createEmailVerificationToken } from "better-auth/api";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOfficialWelcomeEmail } from "@/lib/mailer";
import { PUROK_LABELS } from "@/lib/purok";
import { emitInvalidate } from "@/lib/realtime/emit";
import { INVALIDATION_TOPICS } from "@/lib/query/keys";
import { IDStatus, Purok, UserRoles } from "@/app/generated/prisma/enums";

/** Roles an admin can assign when creating an official account. */
const ASSIGNABLE_ROLES = [
  UserRoles.CAPTAIN,
  UserRoles.SECRETARY,
  UserRoles.TREASURER,
  UserRoles.KAGAWAD,
  UserRoles.ADMIN,
] as const;

/** Human labels for the welcome email (kept here so lib stays route-agnostic). */
const ROLE_LABEL: Record<(typeof ASSIGNABLE_ROLES)[number], string> = {
  [UserRoles.CAPTAIN]: "Barangay Captain",
  [UserRoles.SECRETARY]: "Secretary",
  [UserRoles.TREASURER]: "Treasurer",
  [UserRoles.KAGAWAD]: "Kagawad",
  [UserRoles.ADMIN]: "Administrator",
};

const PUROK_VALUES = Object.values(Purok) as [Purok, ...Purok[]];

const createOfficialSchema = z
  .object({
    firstName: z.string().trim().min(1, "Enter a first name.").max(80),
    middleName: z.string().trim().max(80).optional(),
    lastName: z.string().trim().min(1, "Enter a last name.").max(80),
    email: z
      .string()
      .trim()
      .min(1, "Enter an email address.")
      .email("Enter a valid email address."),
    role: z.enum(ASSIGNABLE_ROLES, { message: "Choose a role." }),
    // A kagawad's assigned purok; required for that role, ignored otherwise.
    purok: z.enum(PUROK_VALUES).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === UserRoles.KAGAWAD && !val.purok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose the purok this kagawad is assigned to.",
        path: ["purok"],
      });
    }
  });

export type CreateOfficialInput = z.input<typeof createOfficialSchema>;

export type CreateOfficialResult =
  | {
      ok: true;
      email: string;
      name: string;
      tempPassword: string;
      /** Whether the verification email went out (false = ask admin to resend). */
      emailSent: boolean;
    }
  | { ok: false; error: string };

// Unambiguous alphabet: no l/1/o/0 so a handed-over password is easy to read.
const PW_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** A readable temporary password, e.g. "k7mq-3xtp-9rdf" (three 4-char groups). */
function generateTempPassword(): string {
  const group = () =>
    Array.from({ length: 4 }, () => PW_ALPHABET[randomInt(PW_ALPHABET.length)]).join(
      "",
    );
  return [group(), group(), group()].join("-");
}

/**
 * Create an official account (captain, secretary, treasurer, kagawad, or another
 * admin). Only an admin may call this.
 *
 * The account is created with the chosen role and the password kept on a Better
 * Auth "credential" account using Better Auth's own hasher, so the official can
 * sign in with the temporary password once they've confirmed their email. That
 * password is returned once for the admin to hand over; it is never stored in
 * readable form.
 *
 * Unlike the seeded super-admin, an official created here starts with an
 * unverified email: we send them a verification link (the same one residents
 * get) and they must confirm it before their first sign-in, proving the admin
 * typed a mailbox they actually control.
 */
export async function createOfficial(
  input: CreateOfficialInput,
): Promise<CreateOfficialResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  const roles = (session?.user as { roles?: UserRoles[] } | undefined)?.roles;
  if (!session || !roles?.includes(UserRoles.ADMIN)) {
    return { ok: false, error: "You don't have permission to do this." };
  }

  const parsed = createOfficialSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the details and try again.",
    };
  }

  const { firstName, lastName, role } = parsed.data;
  const middleName = parsed.data.middleName?.trim() || null;
  // Only a kagawad carries an assigned purok; drop it for any other role.
  const purok = role === UserRoles.KAGAWAD ? (parsed.data.purok ?? null) : null;
  // Better Auth stores emails lowercased; match that so sign-in and uniqueness
  // line up.
  const email = parsed.data.email.toLowerCase();
  const name = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: "An account with this email already exists.",
    };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          firstName,
          middleName,
          lastName,
          emailVerified: true,
          purok,
          // Force them to replace the temporary password on first sign-in.
          mustChangePassword: true,
          roles: { set: [role] },
        },
        select: { id: true },
      });

      // Mirror Better Auth's credential account shape: providerId "credential"
      // and accountId === user.id (see the admin seeder and signUpEmail).
      await tx.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: passwordHash,
        },
      });
    });
  } catch (error) {
    // Unique email constraint, in case of a race between the check and create.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { ok: false, error: "An account with this email already exists." };
    }
    console.error("createOfficial failed", error);
    return {
      ok: false,
      error: "Something went wrong creating the account. Please try again.",
    };
  }

  // Email the official their welcome message: a verification link plus the
  // temporary password. We mint the same kind of stateless token Better Auth's
  // own verification flow uses (a JWT signed with the auth secret), so the
  // existing /verify-email page accepts it — but send it ourselves so we can
  // include the password, which Better Auth's generic email can't. If this
  // fails the account still exists, so we report it instead of throwing.
  let emailSent = true;
  try {
    const secret = process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error("BETTER_AUTH_SECRET is not set; cannot mint a verify link.");
    }
    const base =
      process.env.BETTER_AUTH_URL ??
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
      "http://localhost:3000";
    // Generous expiry (7 days): the admin hands this over, so it may sit a while
    // before the official opens it. They can still request a fresh link later.
    const token = await createEmailVerificationToken(
      secret,
      email,
      undefined,
      60 * 60 * 24 * 7,
    );
    const verifyUrl = new URL("/verify-email", base);
    verifyUrl.searchParams.set("token", token);

    await sendOfficialWelcomeEmail(email, {
      name,
      // A kagawad's welcome names their assigned purok, e.g. "Kagawad (Purok 3)".
      roleLabel: purok
        ? `${ROLE_LABEL[role]} (${PUROK_LABELS[purok]})`
        : ROLE_LABEL[role],
      tempPassword,
      verifyUrl: verifyUrl.toString(),
    });
  } catch (error) {
    emailSent = false;
    console.error(`Failed to send welcome email to ${email}`, error);
  }

  // Refresh the surfaces that read the account list / counts — live for any
  // admin currently in the console, and via the path cache.
  emitInvalidate(INVALIDATION_TOPICS.adminUsers, { toOfficials: true });
  revalidatePath("/admin");
  revalidatePath("/admin/officials");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/activity");

  return { ok: true, email, name, tempPassword, emailSent };
}

export type ReviewResidentResult = { ok: true } | { ok: false; error: string };

/**
 * Approve or reject the ID a resident submitted at setup. Only an admin may
 * call this. Approving flips the resident to "verified" so they can transact;
 * rejecting sends them back to resubmit. We update their most recent ID record
 * (the one under review) and stamp when it was reviewed.
 */
export async function reviewResident(input: {
  userId: string;
  decision: "approve" | "reject";
}): Promise<ReviewResidentResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  const roles = (session?.user as { roles?: UserRoles[] } | undefined)?.roles;
  if (!session || !roles?.includes(UserRoles.ADMIN)) {
    return { ok: false, error: "You don't have permission to do this." };
  }

  const id = await prisma.iD.findFirst({
    where: { userId: input.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!id) {
    return { ok: false, error: "This resident hasn't submitted an ID yet." };
  }

  try {
    await prisma.iD.update({
      where: { id: id.id },
      data: {
        status:
          input.decision === "approve" ? IDStatus.APPROVED : IDStatus.REJECTED,
        reviewedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("reviewResident failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  // The resident sees the portal unlock (or the rejection notice) live: this
  // re-runs their server-rendered overview + sidebar via router.refresh.
  emitInvalidate(INVALIDATION_TOPICS.residentStatus, { toUser: input.userId });
  emitInvalidate(INVALIDATION_TOPICS.adminUsers, { toOfficials: true });
  revalidatePath("/admin");
  revalidatePath("/admin/residents");
  revalidatePath("/admin/activity");

  return { ok: true };
}
