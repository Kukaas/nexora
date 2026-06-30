import type { Metadata } from "next";

import {
  getDocumentRequestsPage,
  getRequestStatusCounts,
  getRequestSummary,
} from "@/lib/secretary-data";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { RequestsTable } from "../../_components/requests-table";

export const metadata: Metadata = {
  title: "Requests · Secretary · Barangay Libtangin",
};

/** Rows per page in the requests table. */
const PAGE_SIZE = 10;

export default async function SecretaryRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Prepare the first two pages of the default (To prepare) view and the tab
  // counts up front; the client fetches further pages only as the secretary
  // moves through them.
  const baseQuery = {
    status: DocumentRequestStatus.PROCESSING,
    start: null,
    end: null,
    pageSize: PAGE_SIZE,
  };
  const [page1, page2, counts, summary] = await Promise.all([
    getDocumentRequestsPage({ ...baseQuery, page: 1 }),
    getDocumentRequestsPage({ ...baseQuery, page: 2 }),
    getRequestStatusCounts(null, null),
    getRequestSummary(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Document requests
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Once the treasurer verifies payment, prepare the document and mark it
          ready to claim.
        </p>
      </header>

      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Awaiting payment" value={summary.pendingCount} />
        <Stat label="To prepare" value={summary.processingCount} accent />
        <Stat label="Ready to claim" value={summary.readyCount} />
      </dl>

      <RequestsTable
        basePath={`/secretary/${id}/requests`}
        pageSize={PAGE_SIZE}
        initialPages={[page1, page2]}
        initialCounts={counts}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        {accent && <span className="size-2 rounded-full bg-primary" aria-hidden />}
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </dd>
    </div>
  );
}
