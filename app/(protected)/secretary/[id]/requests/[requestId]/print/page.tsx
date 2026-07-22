import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LayoutTemplate } from "lucide-react";

import {
  getDocumentRequestById,
  getDocumentTypeById,
} from "@/lib/secretary-data";
import { buildMergeContext, verifyUrl } from "@/lib/documents";
import { ensureVerificationCode } from "@/lib/verification";
import { Button } from "@/components/ui/button";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DocumentPrintView } from "../../../../_components/document-print-view";

export const metadata: Metadata = {
  title: "Print document · Secretary · Barangay Libtangin",
};

export default async function PrintRequestPage({
  params,
}: {
  params: Promise<{ id: string; requestId: string }>;
}) {
  const { id, requestId } = await params;
  const request = await getDocumentRequestById(requestId);
  if (!request) notFound();

  // Printing opens once the request is ready, and stays open after it's claimed
  // so the secretary can reprint if a copy was misprinted or lost.
  if (
    request.status !== DocumentRequestStatus.READY &&
    request.status !== DocumentRequestStatus.CLAIMED
  ) {
    notFound();
  }

  const backHref = `/secretary/${id}/requests/${requestId}`;
  const type = request.documentTypeId
    ? await getDocumentTypeById(request.documentTypeId)
    : null;

  // No designed layout to print yet — point the secretary at the designer.
  if (!type?.template) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link
          href={backHref}
          className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to request
        </Link>
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutTemplate />
            </EmptyMedia>
            <EmptyTitle>No layout to print yet</EmptyTitle>
            <EmptyDescription>
              {request.documentName} doesn&apos;t have a printed layout designed
              yet. Design one, then come back to print this request.
            </EmptyDescription>
          </EmptyHeader>
          {type && (
            <Button asChild>
              <Link href={`/secretary/${id}/documents/${type.id}/design`}>
                <LayoutTemplate />
                Design layout
              </Link>
            </Button>
          )}
        </Empty>
      </div>
    );
  }

  // Every printed document carries a QR that verifies it as genuine. Older
  // requests predating this feature get a code the first time they're printed.
  const code = request.verificationCode ?? (await ensureVerificationCode(request.id));

  return (
    <DocumentPrintView
      templateHtml={type.template}
      context={buildMergeContext(request)}
      backHref={backHref}
      paperSize={type.paperSize}
      orientation={type.orientation}
      verifyUrl={verifyUrl(code)}
    />
  );
}
