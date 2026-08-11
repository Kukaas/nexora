import type { Metadata } from "next";

import {
  getDocumentRequests,
  getDocumentFeeSummary,
} from "@/lib/treasurer-data";
import { formatPeso } from "../../_components/treasurer-ui";
import { DocumentFeesReview } from "../../_components/document-fees-review";

export const metadata: Metadata = {
  title: "Payments · Treasury · Barangay Libtangin",
};

export default async function TreasurerPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [requests, summary] = await Promise.all([
    getDocumentRequests(),
    getDocumentFeeSummary(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Payments & Fee Collection
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Verify resident payment receipts, inspect transaction proof uploads, and clear fee collections for barangay document issuance.
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
          label="Total Collected"
          value={formatPeso(summary.clearedThisMonthTotal)}
          sub="Cleared collections"
        />
      </dl>

      <DocumentFeesReview
        requests={requests}
        basePath={`/treasurer/${id}/payments`}
      />
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
