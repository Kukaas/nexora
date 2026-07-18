/**
 * Shared metadata and helpers for the admin console.
 *
 * Role labels and the date helpers here are used across the overview, officials,
 * residents, and activity screens so the same role reads the same everywhere.
 */
import {
  Crown,
  Gavel,
  Landmark,
  ShieldCheck,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { UserRoles } from "@/app/generated/prisma/enums";

export type RoleMeta = {
  /** Short label for badges and tables. */
  label: string;
  /** What the role does, for the create-account picker. */
  blurb: string;
  icon: LucideIcon;
};

export const ROLE_META: Record<UserRoles, RoleMeta> = {
  [UserRoles.ADMIN]: {
    label: "Administrator",
    blurb: "Full access, including creating official accounts.",
    icon: ShieldCheck,
  },
  [UserRoles.CAPTAIN]: {
    label: "Barangay Captain",
    blurb: "Heads the barangay; approves and signs documents.",
    icon: Crown,
  },
  [UserRoles.SECRETARY]: {
    label: "Secretary",
    blurb: "Keeps records and prepares certificates.",
    icon: Landmark,
  },
  [UserRoles.TREASURER]: {
    label: "Treasurer",
    blurb: "Handles collections, funds, and financial records.",
    icon: Wallet,
  },
  [UserRoles.KAGAWAD]: {
    label: "Kagawad",
    blurb: "Council member; oversees committees and cases.",
    icon: Gavel,
  },
  [UserRoles.RESIDENT]: {
    label: "Resident",
    blurb: "Community member who requests documents.",
    icon: UserRound,
  },
};

/** Roles that count as "officials" (everything except plain residents). */
export const OFFICIAL_ROLES: UserRoles[] = [
  UserRoles.ADMIN,
  UserRoles.CAPTAIN,
  UserRoles.SECRETARY,
  UserRoles.TREASURER,
  UserRoles.KAGAWAD,
];

/**
 * Roles an admin can assign from the create-account picker, in display order.
 * A `const` tuple (not `UserRoles[]`) so the create form's `z.enum` narrows to
 * exactly these roles and lines up with the server action's input type.
 */
export const ASSIGNABLE_ROLES = [
  UserRoles.CAPTAIN,
  UserRoles.SECRETARY,
  UserRoles.TREASURER,
  UserRoles.KAGAWAD,
  UserRoles.ADMIN,
] as const;

/** One of the roles an admin can assign (everything except plain residents). */
export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

/** The most senior role a user holds, used to label a multi-role account. */
export function primaryRole(roles: UserRoles[]): UserRoles {
  return (
    OFFICIAL_ROLES.find((r) => roles.includes(r)) ?? UserRoles.RESIDENT
  );
}

const MANILA = "Asia/Manila";

/** Compact date, e.g. "Jun 27, 2026". Fixed locale + tz so SSR and client agree. */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: MANILA,
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Date + time, e.g. "Jun 27, 2026, 2:14 PM". */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: MANILA,
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Coarse relative time, e.g. "just now", "3h ago", "5d ago", "Jun 1". */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

/** Best display name for an account, falling back through name then email. */
export function displayName(u: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  return (
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    u.name?.trim() ||
    u.email
  );
}

/** Up to two initials from a name, falling back to the first letter or "?". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
