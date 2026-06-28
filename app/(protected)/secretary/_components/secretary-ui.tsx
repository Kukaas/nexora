import {
  BanknoteIcon,
  CheckCircle2,
  Clock,
  Loader,
  QrCode,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DocumentRequestStatus,
  PaymentMethodType,
} from "@/app/generated/prisma/enums";
import { METHOD_LABELS } from "@/lib/payments";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

/** `50` → `₱50.00`. Centralized so every fee reads the same way. */
export function formatPeso(amount: number): string {
  return peso.format(amount);
}

const dateTime = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

const dateOnly = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

/**
 * Request status as a badge: color paired with an icon and a word, never color
 * alone (color-blind safety, low-literacy clarity). Pending wears the brand
 * amber to mark the secretary's action queue; processing is a calm blue while
 * the document is prepared; ready is the green of a finished document; rejected
 * the destructive wash.
 */
export function RequestStatusBadge({
  status,
  className,
}: {
  status: DocumentRequestStatus;
  className?: string;
}) {
  const map = {
    [DocumentRequestStatus.PENDING]: {
      label: "Pending",
      icon: Clock,
      classes: "bg-accent text-accent-foreground",
    },
    [DocumentRequestStatus.PROCESSING]: {
      label: "Processing",
      icon: Loader,
      classes:
        "bg-sky-600/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    },
    [DocumentRequestStatus.READY]: {
      label: "Ready",
      icon: CheckCircle2,
      classes:
        "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    },
    [DocumentRequestStatus.REJECTED]: {
      label: "Rejected",
      icon: XCircle,
      classes: "bg-destructive/10 text-destructive",
    },
  } as const;

  const { label, icon: Icon, classes } = map[status];

  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-3xl px-2.5 text-xs font-medium",
        classes,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/** A payment channel as a quiet outline chip with its mark. */
export function MethodBadge({
  method,
  className,
}: {
  method: PaymentMethodType;
  className?: string;
}) {
  const Icon = method === PaymentMethodType.CASH ? BanknoteIcon : QrCode;
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1.5 rounded-3xl border border-border px-2.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      {METHOD_LABELS[method]}
    </span>
  );
}
