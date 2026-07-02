"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mergeHtml } from "@/lib/tiptap/merge-html";
import { paperLayout } from "@/lib/documents";

/**
 * Renders a request's document ready to print: the type's designed layout with
 * the resident's answers (and system tokens) merged in, on an A4 sheet. The
 * toolbar is hidden when printing (`data-print-hide`); `@media print` in
 * globals.css strips the app chrome so only the sheet remains.
 */
export function DocumentPrintView({
  templateHtml,
  context,
  backHref,
  paperSize,
  orientation,
}: {
  templateHtml: string;
  context: Record<string, string>;
  backHref: string;
  paperSize: string;
  orientation: string;
}) {
  const merged = useMemo(
    () => mergeHtml(templateHtml, context),
    [templateHtml, context],
  );
  const layout = paperLayout(paperSize, orientation);

  return (
    <div className="flex flex-col gap-6">
      {/* Drive the printed page size off the document's chosen paper. This
          @page rule sits after globals.css, so it wins over the A4 default. */}
      <style>{`@page { size: ${layout.css}; margin: 0; }`}</style>

      <div
        data-print-hide
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <Button variant="ghost" asChild>
          <Link href={backHref}>
            <ArrowLeft />
            Back to request
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer />
          Print / Save as PDF
        </Button>
      </div>

      <div className="flex justify-center overflow-auto bg-muted/40 p-4 sm:p-8 print:block print:overflow-visible print:bg-transparent print:p-0">
        <div
          className="nx-doc nx-doc-print"
          style={{
            width: `min(${layout.width}, 100%)`,
            ["--nx-page-h" as string]: layout.height,
          }}
          dangerouslySetInnerHTML={{ __html: merged }}
        />
      </div>
    </div>
  );
}
