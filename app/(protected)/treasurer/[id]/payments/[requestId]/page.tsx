import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Receipt, ShieldCheck } from "lucide-react";

import { getDocumentRequestById } from "@/lib/treasurer-data";
import { formatFieldValue, requestHasPayment } from "@/lib/documents";
import {
  formatDateTime,
  formatPeso,
  MethodBadge,
  RequestStatusBadge,
  WalkInBadge,
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
  const methodKnown =
    hasPayment && !(request.walkIn && request.status === "PENDING");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to Payments
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {request.requesterName}
            </h1>
            {request.walkIn && <WalkInBadge className="shrink-0" />}
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {request.documentName} · <span className="font-mono text-xs text-primary">{request.referenceNumber}</span>
          </p>
        </div>
        <RequestStatusBadge status={request.status} className="mt-1 shrink-0" />
      </header>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Sticky Review Action Panel */}
        <aside className="lg:order-2 lg:sticky lg:top-20">
          <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-baseline justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Assessed Fee</p>
                <span className="font-mono text-3xl font-bold tracking-tight tabular-nums text-foreground">
                  {hasPayment ? formatPeso(request.fee) : "Free"}
                </span>
              </div>
              {methodKnown && <MethodBadge method={request.method} />}
            </div>

            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Request Status</dt>
                <dd>
                  <RequestStatusBadge status={request.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Submitted On</dt>
                <dd className="font-medium text-xs tabular-nums text-foreground">
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
                walkIn={request.walkIn}
              />
            </div>
          </div>
        </aside>

        {/* Full record details */}
        <div className="flex flex-col gap-6 lg:order-1 lg:col-span-2">
          <section className="rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Receipt className="size-4.5 text-primary" />
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Payment & Application Details
              </h2>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border text-sm">
              <Row label="Document Title">{request.documentName}</Row>
              <Row label="Reference Code">
                <span className="font-mono text-primary font-semibold">{request.referenceNumber}</span>
              </Row>
              {request.requesterEmail && (
                <Row label="Resident Account">{request.requesterEmail}</Row>
              )}
              {request.walkIn && (
                <Row label="Resident Account">Walk-in — encoded at desk</Row>
              )}
              {request.purpose && <Row label="Purpose">{request.purpose}</Row>}
              {request.fieldValues.map((field, i) => (
                <Row key={i} label={field.label}>
                  {formatFieldValue(field)}
                </Row>
              ))}
              {request.resubmitNote && (
                <Row label="Resident's Note">{request.resubmitNote}</Row>
              )}
              {hasPayment && request.paymentReference && (
                <Row label="Payment Ref Code">
                  <span className="font-mono font-medium">{request.paymentReference}</span>
                </Row>
              )}
              {request.orNumber && (
                <Row label="Official Receipt (OR)">
                  <span className="font-mono font-semibold text-primary">{request.orNumber}</span>
                </Row>
              )}
              <Row label="Submitted Date">{formatDateTime(request.createdAt)}</Row>
              {request.reviewedAt && (
                <Row label="Verified Date">
                  {formatDateTime(request.reviewedAt)}
                  {request.reviewedByName ? ` · ${request.reviewedByName}` : ""}
                </Row>
              )}
            </dl>
          </section>

          {/* Proof of payment */}
          {hasPayment && (
            <section className="rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <ShieldCheck className="size-4.5 text-primary" />
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Proof of Payment Receipt
                </h2>
              </div>
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
                    className="max-h-[70vh] w-full bg-muted object-contain p-2"
                  />
                  <span className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-2xl bg-background/90 px-3 py-1.5 text-xs font-medium opacity-0 ring-1 ring-foreground/5 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 shadow-sm">
                    <ExternalLink className="size-3.5" aria-hidden />
                    Open full resolution image
                  </span>
                </a>
              ) : (
                <p className="rounded-3xl bg-muted/40 p-4 text-xs text-muted-foreground border border-border">
                  {request.walkIn
                    ? "Walk-in application — collect payment directly at the desk (Cash, GCash, or Maya) and record official receipt when verifying."
                    : "No payment screenshot uploaded. Payment will be settled in cash over the counter."}
                </p>
              )}
            </section>
          )}

          {request.note && (
            <div className="rounded-4xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive shadow-sm">
              <p className="font-semibold">Rejection Note Sent to Resident</p>
              <p className="mt-1 text-pretty text-xs">{request.note}</p>
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
      <dt className="shrink-0 text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-xs text-foreground break-words">{children}</dd>
    </div>
  );
}
