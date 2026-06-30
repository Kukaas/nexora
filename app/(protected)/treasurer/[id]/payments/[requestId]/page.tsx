import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { getDocumentRequestById } from "@/lib/treasurer-data";
import { formatFieldValue, requestHasPayment } from "@/lib/documents";
import {
  formatDateTime,
  formatPeso,
  MethodBadge,
  RequestStatusBadge,
} from "../../../_components/treasurer-ui";
import { DocumentFeeActions } from "../../../_components/document-fee-actions";

export const metadata: Metadata = {
  title: "Payment · Treasury · Barangay Libtangin",
};

export default async function TreasurerPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const request = await getDocumentRequestById(requestId);
  if (!request) notFound();

  const backHref = `/treasurer/${id}/payments`;
  const hasPayment = requestHasPayment(request);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Payments
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {request.requesterName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {request.documentName}
          </p>
        </div>
        <RequestStatusBadge status={request.status} className="mt-1 shrink-0" />
      </header>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Summary + review actions: sticky on desktop, action-first on mobile. */}
        <aside className="lg:order-2 lg:sticky lg:top-20">
          <div className="flex flex-col gap-4 rounded-4xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-3xl font-semibold tabular-nums">
                {hasPayment ? formatPeso(request.fee) : "Free"}
              </span>
              {hasPayment && <MethodBadge method={request.method} />}
            </div>

            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <RequestStatusBadge status={request.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Submitted</dt>
                <dd className="font-medium">
                  {formatDateTime(request.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="border-t border-border pt-4">
              <DocumentFeeActions
                requestId={request.id}
                status={request.status}
                backHref={backHref}
                verifyLabel={hasPayment ? "Verify payment" : "Approve request"}
                requiresOr={hasPayment}
              />
            </div>
          </div>
        </aside>

        {/* Full record */}
        <div className="flex flex-col gap-6 lg:order-1 lg:col-span-2">
          <section>
            <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
              Payment details
            </h2>
            <dl className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border text-sm">
              <Row label="Document">{request.documentName}</Row>
              <Row label="Reference">
                <span className="font-mono">{request.referenceNumber}</span>
              </Row>
              {request.requesterEmail && (
                <Row label="Resident">{request.requesterEmail}</Row>
              )}
              {request.purpose && <Row label="Purpose">{request.purpose}</Row>}
              {request.fieldValues.map((field, i) => (
                <Row key={i} label={field.label}>
                  {formatFieldValue(field)}
                </Row>
              ))}
              {request.resubmitNote && (
                <Row label="Resident's note">{request.resubmitNote}</Row>
              )}
              {hasPayment && request.paymentReference && (
                <Row label="Payment ref.">
                  <span className="font-mono">{request.paymentReference}</span>
                </Row>
              )}
              {request.orNumber && (
                <Row label="OR number">
                  <span className="font-mono">{request.orNumber}</span>
                </Row>
              )}
              <Row label="Submitted">{formatDateTime(request.createdAt)}</Row>
              {request.reviewedAt && (
                <Row label="Reviewed">
                  {formatDateTime(request.reviewedAt)}
                  {request.reviewedByName ? ` · ${request.reviewedByName}` : ""}
                </Row>
              )}
            </dl>
          </section>

          {/* Proof of payment — only when the document actually charges a fee. */}
          {hasPayment && (
            <section>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
                Proof of payment
              </h2>
              {request.proofImage ? (
                <a
                  href={request.proofImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-3xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={request.proofImage}
                    alt={`Payment proof from ${request.requesterName}`}
                    className="max-h-[70vh] w-full bg-muted object-contain"
                  />
                  <span className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-2xl bg-background/90 px-2.5 py-1 text-xs font-medium opacity-0 ring-1 ring-foreground/5 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ExternalLink className="size-3.5" aria-hidden />
                    Open full size
                  </span>
                </a>
              ) : (
                <p className="rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  No screenshot attached. This is being paid in cash at the hall.
                </p>
              )}
            </section>
          )}

          {request.note && (
            <div className="rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">Sent back</p>
              <p className="mt-0.5 text-pretty">{request.note}</p>
            </div>
          )}
        </div>
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
