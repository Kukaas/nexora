import "server-only";

import { prisma } from "@/lib/prisma";
import { IDStatus } from "@/app/generated/prisma/enums";

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
