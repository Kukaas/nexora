"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mergeHtml } from "@/lib/tiptap/merge-html";
import { mmToPx, paperLayout } from "@/lib/documents";

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
  // mergeHtml uses DOMParser (browser-only), so resolve the placeholders after
  // mount. On the server / first client render the sheet is empty (matching
  // markup, no hydration mismatch); the merged document fills in on the client.
  const [merged, setMerged] = useState("");
  useEffect(() => {
    setMerged(mergeHtml(templateHtml, context));
  }, [templateHtml, context]);

  const layout = paperLayout(paperSize, orientation);
  // Render the sheet at its true pixel size (A4 = 794×1123px @96dpi) and scale it
  // to fit the viewport — the exact technique the designer uses — so text wraps
  // and floating elements sit identically to what the secretary designed (and to
  // what prints). A plain `min(width, 100%)` shrank the width but not the font, so
  // a narrow screen wrapped the preview differently from the editor and the PDF.
  const pageW = mmToPx(layout.width);
  const pageH = mmToPx(layout.height);
  const fitRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / pageW));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageW]);

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

      <div className="overflow-auto bg-muted/40 p-4 sm:p-8 print:block print:overflow-visible print:bg-transparent print:p-0">
        <div ref={fitRef} className="w-full">
          {/* Reserve the scaled footprint so the scroll area sizes correctly.
              Collapsed for print (nx-doc-fit) since the sheet goes out of flow. */}
          <div
            className="nx-doc-fit mx-auto"
            style={{ width: pageW * scale, height: pageH * scale }}
          >
            {/* True-size page, scaled to fit — a 1:1 preview of the printed PDF.
                @media print pins it to the page at true size (see globals.css). */}
            <div
              className="nx-doc nx-doc-print"
              style={{
                width: pageW,
                height: pageH,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                ["--nx-page-w" as string]: `${pageW}px`,
                ["--nx-page-h" as string]: `${pageH}px`,
              }}
            >
              {/* Mirror the designer's DOM exactly: the merged HTML lives in a
                  relative `.nx-doc-editor` (page minus the sheet padding), so a
                  floating element's percentage x/y/width resolves against the
                  same inset box the secretary designed against. Rendering it
                  straight into `.nx-doc` resolved those percentages against the
                  full sheet, shifting every element right and overflowing. */}
              <div
                className="nx-doc-editor"
                dangerouslySetInnerHTML={{ __html: merged }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
