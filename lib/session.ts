import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { hasAccess } from "@/lib/roles";
import type { UserRoles } from "@/app/generated/prisma/enums";

/** The current session (with user + roles), or null when signed out. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Require an authenticated user. Redirects to /sign-in when there's no session,
 * otherwise returns the session so the caller can read `session.user`.
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

/**
 * Require access to a role's area. Redirects signed-out users to /sign-in and
 * signed-in users without the role to /start (which forwards them to their own
 * home). ADMIN passes every check.
 */
export async function requireRole(role: UserRoles) {
  const session = await requireSession();
  const roles = session.user.roles as UserRoles[] | undefined;
  if (!hasAccess(roles, role)) redirect("/start");
  return session;
}
