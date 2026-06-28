import type { Metadata } from "next";

import {
  getDocumentRequests,
  getDocumentFeeSummary,
} from "@/lib/treasurer-data";
import { formatPeso } from "../../_components/treasurer-ui";
import { DocumentFeesReview } from "../../_components/document-fees-review";

export const metadata: Metadata = {
  title: "Document fees · Treasury · Barangay Libtangin",
};

export default async function TreasurerDocumentFeesPage({
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
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Document fees</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Verify each resident&apos;s payment, then the secretary prepares the
          document.
        </p>
      </header>

      <dl className="mt-6 flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
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

      <div className="mt-8">
        <DocumentFeesReview
          requests={requests}
          basePath={`/treasurer/${id}/document-fees`}
        />
      </div>
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
