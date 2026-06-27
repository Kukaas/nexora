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
