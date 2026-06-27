import {
  CheckCircle2,
  Clock,
  MailWarning,
  ShieldAlert,
  ShieldQuestion,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { IDStatus } from "@/app/generated/prisma/enums";

/**
 * Lifecycle of an account, derived from the user record:
 * - "active"     verified and ready (resident: ID approved)
 * - "review"     resident finished setup; an official hasn't reviewed the ID yet
 * - "rejected"   resident's ID was rejected and needs resubmitting
 * - "pending"    email verified, resident hasn't finished setup yet
 * - "unverified" email not yet confirmed
 */
export type AccountStatus =
  | "active"
  | "review"
  | "rejected"
  | "pending"
  | "unverified";

const STATUS: Record<
  AccountStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/20",
  },
  review: {
    label: "Awaiting review",
    icon: ShieldQuestion,
    className: "bg-accent text-accent-foreground ring-accent-foreground/15",
  },
  rejected: {
    label: "ID rejected",
    icon: ShieldAlert,
    className:
      "bg-destructive/10 text-destructive ring-destructive/20 dark:bg-destructive/15",
  },
  pending: {
    label: "Setup pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground ring-foreground/10",
  },
  unverified: {
    label: "Email unverified",
    icon: MailWarning,
    className: "bg-muted text-muted-foreground ring-foreground/10",
  },
};

export function AccountStatusBadge({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  const { label, icon: Icon, className: tone } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/**
 * Status for a resident from their user fields and the review state of the ID
 * they submitted. `idStatus` is the most recent ID's status (null when none on
 * file yet). A resident only reads "active" once an official approves their ID.
 */
export function residentStatus(u: {
  emailVerified: boolean;
  profileCompletedAt: Date | null;
  idStatus?: IDStatus | null;
}): AccountStatus {
  if (!u.emailVerified) return "unverified";
  if (!u.profileCompletedAt) return "pending";
  if (u.idStatus === IDStatus.APPROVED) return "active";
  if (u.idStatus === IDStatus.REJECTED) return "rejected";
  return "review";
}
