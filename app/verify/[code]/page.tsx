import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ShieldAlert, ArrowLeft } from "lucide-react";

import { getVerifiedDocument } from "@/lib/verification";
import { BARANGAY, SITE_NAME } from "@/lib/site";
import { Badge } from "@/components/ui/badge";

// A scanned QR points here. It should never be indexed — the page is meant to
// be reached only by scanning a specific document's code.
export const metadata: Metadata = {
  title: "Verify document",
  robots: { index: false, follow: false },
};

function formatIssued(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Public, no-login verification page. Anyone handed a printed barangay document
 * can scan its QR (or type the code) to land here and confirm the document is
 * genuinely one this barangay issued. A valid code shows the document's facts
 * with a clear "authentic" mark; an unknown or not-yet-issued code shows an
 * unambiguous "could not verify" state so a forgery has nowhere to hide.
 */
export default async function VerifyDocumentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const doc = await getVerifiedDocument(code);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-4 py-12">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">{SITE_NAME}</p>
        <h1 className="text-lg font-semibold">{BARANGAY.name}</h1>
        <p className="text-sm text-muted-foreground">
          {BARANGAY.locality}, {BARANGAY.province}
        </p>
      </div>

      {doc ? (
        <section className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-5">
            <BadgeCheck className="size-8 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                Authentic document
              </p>
              <p className="text-sm text-muted-foreground">
                This document was issued by {BARANGAY.name}.
              </p>
            </div>
          </div>

          <dl className="divide-y divide-border">
            <Row label="Document">{doc.documentName}</Row>
            <Row label="Issued to">{doc.holderName}</Row>
            <Row label="Reference number">
              <span className="font-mono">{doc.referenceNumber}</span>
            </Row>
            {doc.purpose && <Row label="Purpose">{doc.purpose}</Row>}
            <Row label="Date issued">{formatIssued(doc.issuedAt)}</Row>
            <Row label="Status">
              <Badge variant="secondary">
                {doc.status === "CLAIMED" ? "Released & claimed" : "Released"}
              </Badge>
            </Row>
          </dl>

          <p className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
            Confirm the name and reference number above match the printed copy in
            your hand. If they differ, the document may not be genuine.
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-amber-500/40 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-amber-500/20 bg-amber-500/10 px-6 py-5">
            <ShieldAlert className="size-8 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-300">
                Couldn&apos;t verify this document
              </p>
              <p className="text-sm text-muted-foreground">
                No issued document matches this code.
              </p>
            </div>
          </div>
          <div className="px-6 py-5 text-sm text-muted-foreground">
            <p>This can happen if:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>the QR code or link was mistyped or damaged,</li>
              <li>the document hasn&apos;t been released yet, or</li>
              <li>the document is not genuine.</li>
            </ul>
            <p className="mt-4">
              If you believe this is a real document, contact {BARANGAY.name} to
              confirm it.
            </p>
          </div>
        </section>
      )}

      <Link
        href="/"
        className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Go to {SITE_NAME}
      </Link>
    </main>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 px-6 py-3.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm font-medium">{children}</dd>
    </div>
  );
}
