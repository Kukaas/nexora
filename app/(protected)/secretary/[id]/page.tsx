import type { Metadata } from "next";

import { getDocumentRequests, getRequestSummary } from "@/lib/secretary-data";
import { RequestsReview } from "../_components/requests-review";

export const metadata: Metadata = {
  title: "Requests · Secretary · Barangay Libtangin",
};

export default async function SecretaryRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [requests, summary] = await Promise.all([
    getDocumentRequests(),
    getRequestSummary(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Document requests
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Once the treasurer verifies payment, prepare the document and mark it
          ready to claim.
        </p>
      </header>

      <dl className="mt-6 flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Awaiting payment" value={summary.pendingCount} />
        <Stat label="To prepare" value={summary.processingCount} />
        <Stat label="Ready to claim" value={summary.readyCount} />
      </dl>

      <div className="mt-8">
        <RequestsReview
          requests={requests}
          basePath={`/secretary/${id}/requests`}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
