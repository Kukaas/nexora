import { BanknoteIcon, CheckCircle2, Clock, QrCode, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  PaymentMethodType,
  PaymentStatus,
} from "@/app/generated/prisma/enums";
import { METHOD_LABELS } from "@/lib/payments";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

/** `1234.5` → `₱1,234.50`. Centralized so every amount reads the same way. */
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

/**
 * Status as a badge: color paired with an icon and a word, never color alone
 * (color-blind safety, low-literacy clarity). Pending wears the brand amber,
 * verified a green wash, rejected the destructive wash.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  const map = {
    [PaymentStatus.PENDING]: {
      label: "Pending",
      icon: Clock,
      classes: "bg-accent text-accent-foreground",
    },
    [PaymentStatus.VERIFIED]: {
      label: "Verified",
      icon: CheckCircle2,
      classes:
        "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    },
    [PaymentStatus.REJECTED]: {
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
