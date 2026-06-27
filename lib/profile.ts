import "server-only";

import { prisma } from "@/lib/prisma";

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
