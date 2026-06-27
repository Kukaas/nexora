import { UserRoles } from "@/app/generated/prisma/enums";

/**
 * Where each role lands after signing in, and the URL prefix that role's area
 * lives under. Keys must stay in sync with the folders in `app/(protected)/`.
 */
export const ROLE_HOME: Record<UserRoles, string> = {
  [UserRoles.ADMIN]: "/admin",
  [UserRoles.CAPTAIN]: "/captain",
  [UserRoles.SECRETARY]: "/secretary",
  [UserRoles.TREASURER]: "/treasurer",
  [UserRoles.KAGAWAD]: "/kagawad",
  [UserRoles.RESIDENT]: "/resident",
};

/**
 * Most-privileged first. A user can hold several roles, so this decides which
 * area they land on: the highest one wins.
 */
export const ROLE_PRIORITY: UserRoles[] = [
  UserRoles.ADMIN,
  UserRoles.CAPTAIN,
  UserRoles.SECRETARY,
  UserRoles.TREASURER,
  UserRoles.KAGAWAD,
  UserRoles.RESIDENT,
];

/** The home path for a user's highest-priority role. Defaults to /resident. */
export function resolveHomePath(roles: UserRoles[] | undefined | null): string {
  const owned = new Set(roles ?? []);
  const top = ROLE_PRIORITY.find((role) => owned.has(role));
  return top ? ROLE_HOME[top] : ROLE_HOME[UserRoles.RESIDENT];
}

/**
 * Whether a user may enter a role's area. ADMIN is allowed everywhere; everyone
 * else needs the matching role.
 */
export function hasAccess(
  roles: UserRoles[] | undefined | null,
  area: UserRoles,
): boolean {
  const owned = roles ?? [];
  return owned.includes(UserRoles.ADMIN) || owned.includes(area);
}
