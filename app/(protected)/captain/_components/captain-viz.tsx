"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { formatPeso } from "./captain-ui";

/**
 * Chart, filter, and export plumbing shared by the captain's analytics
 * screens (overview, requests, payments), so all three read and export the
 * same way. Charts keep one hue each — identity is carried by labels, not
 * color; only status uses the product's status palette, always beside text.
 */

export const VERIFIED_STATUSES: DocumentRequestStatus[] = [
  DocumentRequestStatus.PROCESSING,
  DocumentRequestStatus.READY,
  DocumentRequestStatus.CLAIMED,
];

export const STATUS_META: {
  status: DocumentRequestStatus;
  label: string;
  bar: string;
}[] = [
  {
    status: DocumentRequestStatus.PENDING,
    label: "Pending",
    bar: "bg-primary",
  },
  {
    status: DocumentRequestStatus.PROCESSING,
    label: "Processing",
    bar: "bg-sky-600 dark:bg-sky-400",
  },
  {
    status: DocumentRequestStatus.READY,
    label: "Ready",
    bar: "bg-emerald-600 dark:bg-emerald-400",
  },
  {
    status: DocumentRequestStatus.CLAIMED,
    label: "Claimed",
    bar: "bg-slate-500 dark:bg-slate-400",
  },
  {
    status: DocumentRequestStatus.REJECTED,
    label: "Rejected",
    bar: "bg-destructive",
  },
];

export function statusLabelOf(status: DocumentRequestStatus): string {
  return STATUS_META.find((m) => m.status === status)?.label ?? status;
}

// Series colors come from the UI itself. Request volume wears the brand's
// warm ink: Burnt Amber (--accent-foreground) on white — Service Amber is too
// light for marks there and is reserved for action/state — and Service Amber
// (--primary) on dark, where it has the contrast. Money wears the exact
// emerald of the UI's "Verified" badges, since collected = verified fees.
export const REQUESTS_CHART = {
  requests: {
    label: "Requests",
    theme: {
      light: "var(--accent-foreground)",
      dark: "var(--primary)",
    },
  },
} satisfies ChartConfig;

export const COLLECTIONS_CHART = {
  amount: {
    label: "Collected",
    theme: {
      light: "oklch(0.596 0.145 163.225)", // emerald-600, as in badges
      dark: "oklch(0.765 0.177 163.223)", // emerald-400
    },
  },
} satisfies ChartConfig;

// ── Time bucketing ───────────────────────────────────────────────────────────

type Granularity = "day" | "week" | "month";

export const DAY_MS = 86_400_000;

function alignTo(ms: number, granularity: Granularity): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  if (granularity === "week") {
    // Weeks start on Monday.
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  } else if (granularity === "month") {
    d.setDate(1);
  }
  return d.getTime();
}

function nextBucket(ms: number, granularity: Granularity): number {
  const d = new Date(ms);
  if (granularity === "day") d.setDate(d.getDate() + 1);
  else if (granularity === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

function bucketLabel(
  ms: number,
  granularity: Granularity,
  spansYears: boolean,
) {
  const d = new Date(ms);
  if (granularity === "month") {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      ...(spansYears ? { year: "2-digit" } : {}),
    }).format(d);
  }
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
  }).format(d);
}

export type Buckets = {
  labels: string[];
  indexOf(iso: string): number | undefined;
};

/**
 * Continuous, zero-fillable buckets covering [startMs, endMs], sized so the
 * x-axis stays readable: days up to ~2 months, then weeks up to ~1 year, then
 * months.
 */
export function buildBuckets(startMs: number, endMs: number): Buckets {
  const days = Math.max(1, (endMs - startMs) / DAY_MS);
  const granularity: Granularity =
    days <= 62 ? "day" : days <= 370 ? "week" : "month";

  const starts: number[] = [];
  for (
    let t = alignTo(startMs, granularity);
    t <= endMs;
    t = nextBucket(t, granularity)
  ) {
    starts.push(t);
  }

  const spansYears =
    new Date(startMs).getFullYear() !== new Date(endMs).getFullYear();
  const index = new Map(starts.map((t, i) => [t, i]));
  return {
    labels: starts.map((t) => bucketLabel(t, granularity, spansYears)),
    indexOf(iso: string): number | undefined {
      return index.get(alignTo(new Date(iso).getTime(), granularity));
    },
  };
}

// ── CSV export ───────────────────────────────────────────────────────────────

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const exportDate = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** `slug` → `barangay-slug-2026-07-16.csv`, downloaded on the spot. */
export function downloadCsv(slug: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  // The BOM makes Excel read the file as UTF-8 (₱ and Filipino names intact).
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `barangay-${slug}-${exportDate.format(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Charts ───────────────────────────────────────────────────────────────────

/** `1234` → `₱1.2k` for axis ticks; full amounts live in the tooltip. */
export function compactPeso(value: number): string {
  if (value === 0) return "₱0";
  if (value >= 1000)
    return `₱${(value / 1000).toLocaleString("en-PH", { maximumFractionDigits: 1 })}k`;
  return `₱${value.toLocaleString("en-PH")}`;
}

/**
 * One time series as thin rounded bars. `peso` switches the y-axis and the
 * tooltip to currency formatting.
 */
export function TimeSeriesBars({
  series,
  config,
  dataKey,
  peso = false,
}: {
  series: Record<string, string | number>[];
  config: ChartConfig;
  dataKey: string;
  peso?: boolean;
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={peso ? 44 : 32}
          allowDecimals={false}
          tickFormatter={peso ? (v: number) => compactPeso(v) : undefined}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={
                peso
                  ? (value, name, item) => (
                      <div className="flex w-full items-center gap-2">
                        <div
                          className="size-2.5 shrink-0 rounded-[2px]"
                          style={{ background: item.color }}
                          aria-hidden
                        />
                        <span className="text-muted-foreground">
                          {String(config[dataKey]?.label ?? name)}
                        </span>
                        <span className="ml-auto font-mono font-medium tabular-nums">
                          {formatPeso(Number(value))}
                        </span>
                      </div>
                    )
                  : undefined
              }
            />
          }
        />
        <Bar
          dataKey={dataKey}
          fill={`var(--color-${dataKey})`}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ChartContainer>
  );
}

// ── Layout pieces ────────────────────────────────────────────────────────────

export function Kpi({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{sub}</span>
      </dd>
    </div>
  );
}

export function KpiStrip({ children }: { children: React.ReactNode }) {
  return (
    <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 md:flex-row md:divide-x md:divide-y-0">
      {children}
    </dl>
  );
}

export function ChartCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-4xl border border-border bg-card p-5 break-inside-avoid">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
          {caption}
        </p>
      </div>
      {children}
    </section>
  );
}

/**
 * A labeled proportional bar. The text label carries identity and the number
 * carries the value, so the bar color is never the only signal.
 */
export function BreakdownRow({
  label,
  value,
  max,
  barClass,
  sub,
}: {
  label: string;
  value: number;
  max: number;
  barClass: string;
  sub?: string;
}) {
  const pct = value === 0 ? 0 : Math.max(3, (value / max) * 100);
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm" title={label}>
        {label}
      </span>
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${barClass}`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </span>
      <span className="w-16 shrink-0 text-right text-sm">
        <span className="font-medium tabular-nums">{value}</span>
        {sub && (
          <span className="block text-xs text-muted-foreground tabular-nums">
            {sub}
          </span>
        )}
      </span>
    </li>
  );
}

export function BreakdownEmpty() {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">
      Nothing in this view yet.
    </p>
  );
}

/** The pill tab row used to slice a list by one dimension, with counts. */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; count: number }[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                active
                  ? "bg-accent text-accent-foreground"
                  : "bg-border/70 text-muted-foreground",
              )}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Prev/next paging for a client-filtered list. */
export function PagerRow({
  page,
  pageCount,
  from,
  to,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-1 print:hidden">
      <p className="text-sm text-muted-foreground tabular-nums">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <PagerButton
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </PagerButton>
        <PagerButton
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1 rounded-4xl border border-border bg-card px-3.5 text-sm font-medium outline-none transition-colors hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}
