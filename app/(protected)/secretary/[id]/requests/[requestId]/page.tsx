import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BanknoteIcon,
  ExternalLink,
  Printer,
} from "lucide-react";

import {
  getDocumentRequestById,
  getDocumentTypeById,
} from "@/lib/secretary-data";
import { formatFieldValue, requestHasPayment } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import {
  formatDate,
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

  const backHref = `/secretary/${id}/requests`;
  const hasPayment = requestHasPayment(request);

  // Printing requires both a designed layout and the exact READY status.
  const type = request.documentTypeId
    ? await getDocumentTypeById(request.documentTypeId)
    : null;
  const canPrint =
    request.status === DocumentRequestStatus.READY && Boolean(type?.template);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link
        href={backHref}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Document requests
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {request.documentName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Requested by {request.requesterName}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Summary + action: sticky on desktop, action-first on mobile. */}
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
                <dt className="text-muted-foreground">Requested</dt>
                <dd className="font-medium">{formatDate(request.createdAt)}</dd>
              </div>
            </dl>

            <div className="flex flex-col gap-3 border-t border-border pt-4">
              {canPrint && (
                <Button asChild>
                  <Link href={`${backHref}/${request.id}/print`}>
                    <Printer />
                    Print document
                  </Link>
                </Button>
              )}
              <RequestReadyAction
                requestId={request.id}
                status={request.status}
                backHref={backHref}
              />
            </div>
          </div>
        </aside>

        {/* Full record */}
        <div className="flex flex-col gap-6 lg:order-1 lg:col-span-2">
          <section>
            <h2 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground">
              Request details
            </h2>
            <dl className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border text-sm">
              <Row label="Reference">
                <span className="font-mono">{request.referenceNumber}</span>
              </Row>
              {request.requesterEmail && (
                <Row label="Email">{request.requesterEmail}</Row>
              )}
              {request.purpose && <Row label="Purpose">{request.purpose}</Row>}
              {request.fieldValues.map((field, i) => (
                <Row key={i} label={field.label}>
                  {formatFieldValue(field)}
                </Row>
              ))}
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
              <Row label="Requested">{formatDateTime(request.createdAt)}</Row>
              {request.reviewedAt && (
                <Row label="Reviewed">
                  {formatDateTime(request.reviewedAt)}
                  {request.reviewedByName ? ` · ${request.reviewedByName}` : ""}
                </Row>
              )}
              {request.releasedAt && (
                <Row label="Ready since">
                  {formatDateTime(request.releasedAt)}
                </Row>
              )}
            </dl>
          </section>

          {/* Proof of payment — only when the document charges a fee. The
              treasurer owns verification; this is read-only context. */}
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
                    className="max-h-[60vh] w-full bg-muted object-contain transition-transform duration-300 ease-out group-hover:scale-[1.01] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <span className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-2xl bg-background/90 px-2.5 py-1 text-xs font-medium opacity-0 ring-1 ring-foreground/5 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                    <ExternalLink className="size-3.5" aria-hidden />
                    Open full size
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  <BanknoteIcon className="size-4 shrink-0" aria-hidden />
                  <span>
                    No screenshot attached. This is being paid in cash at the
                    hall.
                  </span>
                </div>
              )}
            </section>
          )}

          {request.note && (
            <div className="flex gap-3 rounded-3xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">Sent back to the resident</p>
                <p className="mt-0.5 text-pretty">{request.note}</p>
              </div>
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
