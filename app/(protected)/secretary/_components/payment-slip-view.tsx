"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BARANGAY, type DocumentRequestDTO } from "@/lib/documents";
import { APP_TIME_ZONE } from "@/lib/site";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

/**
 * A half-page payment slip the secretary hands to a walk-in resident: the
 * reference number the treasurer looks the request up by, what's being
 * requested, and the amount due. Rendered on the `.nx-doc` sheet so the
 * app-wide `@media print` rules (globals.css) strip everything but the slip
 * when printing — the same mechanism the document print view uses.
 */
export function PaymentSlipView({
  request,
  backHref,
}: {
  request: DocumentRequestDTO;
  backHref: string;
}) {
  const free = request.fee <= 0;
  const requestedOn = new Date(request.createdAt).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: APP_TIME_ZONE,
  });

  return (
    <div className="flex flex-col gap-6">
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
          Print slip
        </Button>
      </div>

      <div className="nx-doc nx-doc-print mx-auto w-full max-w-2xl">
        <div className="border-b border-neutral-300 pb-4 text-center">
          <p className="text-sm tracking-wide uppercase">
            Republic of the Philippines
          </p>
          <p className="text-lg font-semibold">{BARANGAY.name}</p>
          <p className="text-sm">{BARANGAY.area}</p>
        </div>

        <p className="mt-6 text-center text-base font-semibold tracking-widest uppercase">
          Document payment slip
        </p>

        <div className="mt-5 border border-neutral-400 px-6 py-4 text-center">
          <p className="text-xs tracking-wide uppercase">Reference number</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider">
            {request.referenceNumber}
          </p>
        </div>

        <table className="mt-6 w-full text-sm">
          <tbody>
            <SlipRow label="Document">{request.documentName}</SlipRow>
            <SlipRow label="Requested by">{request.requesterName}</SlipRow>
            {request.purpose && (
              <SlipRow label="Purpose">{request.purpose}</SlipRow>
            )}
            <SlipRow label="Date requested">{requestedOn}</SlipRow>
            <SlipRow label="Amount due">
              <span className="font-bold">
                {free ? "Free" : peso.format(request.fee)}
              </span>
            </SlipRow>
          </tbody>
        </table>

        <p className="mt-6 border-t border-neutral-300 pt-4 text-sm leading-relaxed">
          {free
            ? "Present this slip to the Barangay Treasurer to have the request approved, then return to the Barangay Secretary to claim the document."
            : "Present this slip to the Barangay Treasurer and pay the amount due in cash or by e-wallet. Once the payment is verified, return to the Barangay Secretary to claim the document."}
        </p>
      </div>
    </div>
  );
}

function SlipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td className="w-40 py-1.5 pr-4 align-top text-neutral-600">{label}</td>
      <td className="py-1.5 align-top font-medium">{children}</td>
    </tr>
  );
}
