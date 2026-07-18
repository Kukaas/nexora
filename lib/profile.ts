import "server-only";

import { prisma } from "@/lib/prisma";
import { IDStatus, type IDType, type Purok } from "@/app/generated/prisma/enums";

/**
 * Whether the resident has finished the setup/verification step. Read straight
 * from the database (not the session) so it's always current right after the
 * setup form submits and redirects.
 */
export async function isProfileComplete(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileCompletedAt: true },
  });
  return Boolean(user?.profileCompletedAt);
}

/**
 * A resident's residency-verification state, decided by an official's review of
 * the ID they submitted at setup:
 * - "pending"  ID submitted, an official hasn't reviewed it yet (default)
 * - "approved" official confirmed the ID — the resident can transact
 * - "rejected" official rejected the ID — the resident needs to resubmit
 *
 * Derived from the resident's most recent ID record so there's one source of
 * truth (the ID under review), read fresh so the gate flips the moment an
 * official decides. A resident with no ID on file yet reads as "pending".
 */
export type ResidencyStatus = "pending" | "approved" | "rejected";

export async function getResidencyStatus(
  userId: string,
): Promise<ResidencyStatus> {
  const id = await prisma.iD.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });
  if (id?.status === IDStatus.APPROVED) return "approved";
  if (id?.status === IDStatus.REJECTED) return "rejected";
  return "pending";
}

/** Whether an official has approved the resident's ID (gate for transacting). */
export async function isResidencyVerified(userId: string): Promise<boolean> {
  return (await getResidencyStatus(userId)) === "approved";
}

/**
 * Whether the user still has the temporary password an admin set for them and
 * must replace it before continuing. Read fresh from the database so the gate
 * clears the instant the change-password form succeeds.
 */
export async function mustChangePassword(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  });
  return Boolean(user?.mustChangePassword);
}

/**
 * Which sign-in methods a user has. Better Auth stores an email/password login
 * as a "credential" account and a Google login as a "google" account. Only a
 * user with a credential account can change their password; a Google-only user
 * has no password to change.
 */
export type SignInMethods = { hasPassword: boolean; hasGoogle: boolean };

export async function getSignInMethods(
  userId: string,
): Promise<SignInMethods> {
  const accounts = await prisma.account.findMany({
    where: { userId },
    select: { providerId: true },
  });
  return {
    hasPassword: accounts.some((a) => a.providerId === "credential"),
    hasGoogle: accounts.some((a) => a.providerId === "google"),
  };
}

export type ResidentIdRecord = {
  type: IDType;
  number: string;
  frontImage: string;
  backImage: string | null;
  status: IDStatus;
  reviewedAt: string | null;
  createdAt: string;
};

export type ResidentProfile = {
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  image: string | null;
  birthDate: string | null;
  mobileNumber: string | null;
  purok: Purok | null;
  id: ResidentIdRecord | null;
  residency: ResidencyStatus;
  signIn: SignInMethods;
};

/**
 * Everything the resident profile page needs in one read: the editable personal
 * details, the government ID currently on file (the most recent one, which is
 * what verification hinges on), the derived residency status, and the sign-in
 * methods that decide whether a "change password" option is offered.
 */
export async function getResidentProfile(
  userId: string,
): Promise<ResidentProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      name: true,
      email: true,
      image: true,
      birthDate: true,
      mobileNumber: true,
      purok: true,
      ids: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          type: true,
          number: true,
          frontImage: true,
          backImage: true,
          status: true,
          reviewedAt: true,
          createdAt: true,
        },
      },
      accounts: { select: { providerId: true } },
    },
  });
  if (!user) return null;

  const latestId = user.ids[0];
  const residency: ResidencyStatus =
    latestId?.status === IDStatus.APPROVED
      ? "approved"
      : latestId?.status === IDStatus.REJECTED
        ? "rejected"
        : "pending";

  return {
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    image: user.image,
    birthDate: user.birthDate?.toISOString() ?? null,
    mobileNumber: user.mobileNumber,
    purok: user.purok,
    id: latestId
      ? {
          type: latestId.type,
          number: latestId.number,
          frontImage: latestId.frontImage,
          backImage: latestId.backImage,
          status: latestId.status,
          reviewedAt: latestId.reviewedAt?.toISOString() ?? null,
          createdAt: latestId.createdAt.toISOString(),
        }
      : null,
    residency,
    signIn: {
      hasPassword: user.accounts.some((a) => a.providerId === "credential"),
      hasGoogle: user.accounts.some((a) => a.providerId === "google"),
    },
  };
}
