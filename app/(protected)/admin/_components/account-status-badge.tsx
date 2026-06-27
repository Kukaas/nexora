import { CheckCircle2, Clock, MailWarning, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Lifecycle of an account, derived from the user record:
 * - "active"    email verified and (for residents) profile complete
 * - "pending"   email verified, resident hasn't finished setup yet
 * - "unverified" email not yet confirmed
 */
export type AccountStatus = "active" | "pending" | "unverified";

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
  pending: {
    label: "Setup pending",
    icon: Clock,
    className: "bg-accent text-accent-foreground ring-accent-foreground/15",
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

/** Status for a resident from their user fields. */
export function residentStatus(u: {
  emailVerified: boolean;
  profileCompletedAt: Date | null;
}): AccountStatus {
  if (!u.emailVerified) return "unverified";
  return u.profileCompletedAt ? "active" : "pending";
}
