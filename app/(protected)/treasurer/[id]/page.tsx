import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, QrCode, Receipt } from "lucide-react";

import { getDocumentFeeSummary } from "@/lib/treasurer-data";
import { formatPeso } from "../_components/treasurer-ui";

export const metadata: Metadata = {
  title: "Overview · Treasury · Barangay Libtangin",
};

export default async function TreasurerOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const summary = await getDocumentFeeSummary();
  const home = `/treasurer/${id}`;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          A quick look at the treasury: payments waiting on you and what&apos;s
          cleared this month.
        </p>
      </header>

      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat
          label="Awaiting verification"
          value={String(summary.pendingCount)}
          sub={`${formatPeso(summary.pendingTotal)} pending`}
        />
        <Stat
          label="Verified this month"
          value={String(summary.clearedThisMonth)}
          sub={`${formatPeso(summary.clearedThisMonthTotal)} cleared`}
        />
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-medium tracking-wide text-muted-foreground">
          Go to
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionCard
            href={`${home}/payments`}
            icon={Receipt}
            title="Payments"
            description="Verify resident payments for document requests."
            badge={
              summary.pendingCount > 0 ? summary.pendingCount : undefined
            }
          />
          <ActionCard
            href={`${home}/methods`}
            icon={QrCode}
            title="Payment methods"
            description="Set up GCash, Maya, and cash for residents."
          />
        </div>
      </section>
    </div>
  );
}

function Stat({
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
      <dd className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-sm text-muted-foreground">{sub}</span>
      </dd>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
}: {
  href: string;
  icon: typeof Receipt;
  title: string;
  description: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-4xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 dark:ring-foreground/10"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-medium">
          {title}
          {badge !== undefined && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-medium text-accent-foreground tabular-nums">
              {badge}
            </span>
          )}
        </span>
        <span className="block text-sm text-muted-foreground text-pretty">
          {description}
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
      />
    </Link>
  );
}
