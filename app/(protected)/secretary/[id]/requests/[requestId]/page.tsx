import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getDocumentRequestById } from "@/lib/secretary-data";
import { requestHasPayment } from "@/lib/documents";
import {
  formatDateTime,
  formatPeso,
  MethodBadge,
  RequestStatusBadge,
} from "../../../_components/secretary-ui";
import { RequestReadyAction } from "../../../_components/request-ready-action";

export const metadata: Metadata = {
  title: "Request · Secretary · Barangay Libtangin",
};

export default async function SecretaryRequestPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const request = await getDocumentRequestById(requestId);
  if (!request) notFound();

  const backHref = `/secretary/${id}`;
  const hasPayment = requestHasPayment(request);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Document requests
      </Link>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {request.documentName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {request.requesterName}
          </p>
        </div>
        <RequestStatusBadge status={request.status} className="mt-1 shrink-0" />
      </header>

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <span className="font-mono text-4xl font-semibold tabular-nums">
          {hasPayment ? formatPeso(request.fee) : "Free"}
        </span>
        {hasPayment && <MethodBadge method={request.method} />}
      </div>

      <dl className="mt-6 grid gap-px overflow-hidden rounded-3xl border border-border bg-border text-sm">
        <Row label="Reference">
          <span className="font-mono">{request.referenceNumber}</span>
        </Row>
        <Row label="Resident">{request.requesterName}</Row>
        {request.requesterEmail && (
          <Row label="Email">{request.requesterEmail}</Row>
        )}
        {request.purpose && <Row label="Purpose">{request.purpose}</Row>}
        {hasPayment && request.paymentReference && (
          <Row label="Payment ref.">
            <span className="font-mono">{request.paymentReference}</span>
          </Row>
        )}
        <Row label="Requested">{formatDateTime(request.createdAt)}</Row>
        {request.reviewedAt && (
          <Row label="Reviewed">
            {formatDateTime(request.reviewedAt)}
            {request.reviewedByName ? ` · ${request.reviewedByName}` : ""}
          </Row>
        )}
        {request.releasedAt && (
          <Row label="Ready since">{formatDateTime(request.releasedAt)}</Row>
        )}
      </dl>

      {/* Proof of payment — only when the document actually charges a fee. The
          treasurer owns verification; this is shown read-only for context. */}
      {hasPayment && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
            Proof of payment
          </p>
          {request.proofImage ? (
            <a
              href={request.proofImage}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-3xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={request.proofImage}
                alt={`Payment proof from ${request.requesterName}`}
                className="max-h-[70vh] w-full bg-muted object-contain"
              />
            </a>
          ) : (
            <p className="rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              No screenshot attached. This is being paid in cash at the hall.
            </p>
          )}
        </div>
      )}

      {request.note && (
        <div className="mt-5 rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Sent back</p>
          <p className="mt-0.5">{request.note}</p>
        </div>
      )}

      <div className="mt-8 border-t border-border pt-6">
        <RequestReadyAction
          requestId={request.id}
          status={request.status}
          backHref={backHref}
        />
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 bg-card px-4 py-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  );
}
