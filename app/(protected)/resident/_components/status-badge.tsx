import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  PackageCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { RequestStatus } from "../_data";

const STATUS: Record<
  RequestStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  issued: {
    label: "Ready to claim",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/20",
  },
  claimed: {
    label: "Claimed",
    icon: PackageCheck,
    className:
      "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800/50 dark:text-slate-300 dark:ring-slate-400/20",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    className: "bg-accent text-accent-foreground ring-accent-foreground/15",
  },
  submitted: {
    label: "Submitted",
    icon: Inbox,
    className: "bg-muted text-muted-foreground ring-foreground/10",
  },
  action: {
    label: "Action needed",
    icon: AlertTriangle,
    className:
      "bg-destructive/10 text-destructive ring-destructive/20 dark:bg-destructive/20",
  },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
