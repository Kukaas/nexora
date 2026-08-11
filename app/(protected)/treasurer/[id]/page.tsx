import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText, QrCode, Receipt } from "lucide-react";

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
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Treasury Overview & Financial Console
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Monitor incoming resident document fee payments, configure payment channels, and generate official Commission on Audit (COA) statements.
          </p>
        </div>
      </header>

      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
        <Stat
          label="Awaiting Verification"
          value={String(summary.pendingCount)}
          sub={`${formatPeso(summary.pendingTotal)} pending`}
          accent
        />
        <Stat
          label="Verified This Month"
          value={String(summary.clearedThisMonth)}
          sub={`${formatPeso(summary.clearedThisMonthTotal)} cleared`}
        />
        <Stat
          label="Total Cleared Revenue"
          value={formatPeso(summary.clearedThisMonthTotal)}
          sub="Monthly cleared total"
        />
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Actions & Modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <ActionCard
            href={`${home}/payments`}
            icon={Receipt}
            title="Payments Queue"
            description="Verify resident payment receipts and clear document fees."
            badge={
              summary.pendingCount > 0 ? summary.pendingCount : undefined
            }
          />
          <ActionCard
            href={`${home}/methods`}
            icon={QrCode}
            title="Payment Channels"
            description="Set up GCash, Maya QR codes, and cash desk instructions."
          />
          <ActionCard
            href={`${home}/coa-reports`}
            icon={FileText}
            title="COA Financial Reports"
            description="View official collection logs and export COA statements."
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
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span
          className={`text-2xl font-semibold tabular-nums ${
            accent ? "text-primary font-bold" : "text-foreground"
          }`}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{sub}</span>
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
        <span className="flex items-center gap-2 font-medium text-foreground">
          {title}
          {badge !== undefined && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
              {badge}
            </span>
          )}
        </span>
        <span className="block text-xs text-muted-foreground text-pretty mt-0.5">
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
