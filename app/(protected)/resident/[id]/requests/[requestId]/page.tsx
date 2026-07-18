import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertCircle, ArrowLeft, ExternalLink, Pencil } from "lucide-react";

import { getSession } from "@/lib/session";
import { getMyDocumentRequestById } from "@/lib/documents-data";
import {
  formatFieldValue,
  requestHasPayment,
  REQUEST_STATUS_LABELS,
} from "@/lib/documents";
import { METHOD_LABELS } from "@/lib/payments";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../../../_components/status-badge";
import { formatFullDate, residentStatus } from "../../../_data";

export const metadata: Metadata = {
  title: "Request · Barangay Libtangin",
};

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

export default async function ResidentRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const request = await getMyDocumentRequestById(session.user.id, requestId);
  if (!request) notFound();

  const backHref = `/resident/${id}/requests`;
  const hasPayment = requestHasPayment(request);
  const rejected = request.status === DocumentRequestStatus.REJECTED;
  const editable = rejected || request.status === DocumentRequestStatus.PENDING;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My requests
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {request.documentName}
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {request.referenceNumber}
          </p>
        </div>
        {editable && (
          <Button asChild variant={rejected ? "default" : "outline"}>
            <Link href={`${backHref}/${request.id}/edit`}>
              <Pencil />
              {rejected ? "Resubmit" : "Edit request"}
            </Link>
          </Button>
        )}
      </header>

      {request.note && (
        <div className="flex gap-3 rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Sent back to fix</p>
            <p className="mt-0.5 text-pretty">{request.note}</p>
            {editable && (
              <p className="mt-1 text-pretty">
                Use Resubmit to fix it and send it back for review.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <aside className="lg:order-2 lg:sticky lg:top-20">
          <div className="flex flex-col gap-4 rounded-4xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-3xl font-semibold tabular-nums">
                {hasPayment ? peso.format(request.fee) : "Free"}
              </span>
            </div>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <StatusBadge status={residentStatus(request.status)} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Stage</dt>
                <dd className="font-medium">
                  {REQUEST_STATUS_LABELS[request.status]}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Requested</dt>
                <dd className="font-medium">
                  {formatFullDate(request.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="flex flex-col gap-6 lg:order-1 lg:col-span-2">
          <section>
            <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
              Request details
            </h2>
            <dl className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border text-sm">
              <Row label="Reference">
                <span className="font-mono">{request.referenceNumber}</span>
              </Row>
              {request.purpose && <Row label="Purpose">{request.purpose}</Row>}
              {request.fieldValues.map((field, i) => (
                <Row key={i} label={field.label}>
                  {formatFieldValue(field)}
                </Row>
              ))}
              {request.resubmitNote && (
                <Row label="Your note">{request.resubmitNote}</Row>
              )}
              {hasPayment && (
                <Row label="Payment">{METHOD_LABELS[request.method]}</Row>
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
              {request.releasedAt && (
                <Row label="Ready since">
                  {formatFullDate(request.releasedAt)}
                </Row>
              )}
            </dl>
          </section>

          {hasPayment && request.proofImage && (
            <section>
              <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
                Proof of payment
              </h2>
              <a
                href={request.proofImage}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block overflow-hidden rounded-3xl border border-border outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={request.proofImage}
                  alt="Your payment screenshot"
                  className="max-h-[60vh] w-full bg-muted object-contain"
                />
                <span className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-2xl bg-background/90 px-2.5 py-1 text-xs font-medium opacity-0 ring-1 ring-foreground/5 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ExternalLink className="size-3.5" aria-hidden />
                  Open full size
                </span>
              </a>
            </section>
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
