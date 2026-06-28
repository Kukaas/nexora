"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ImageUp,
  Maximize2,
  QrCode,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PaymentMethodType } from "@/app/generated/prisma/enums";
import { METHOD_LABELS, type PaymentMethodDTO } from "@/lib/payments";
import { turnaroundLabel, type DocumentTypeDTO } from "@/lib/documents";
import { submitDocumentRequest } from "@/lib/document-actions";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});
const formatPeso = (n: number) => peso.format(n);

const METHOD_ICON: Record<PaymentMethodType, LucideIcon> = {
  [PaymentMethodType.GCASH]: QrCode,
  [PaymentMethodType.MAYA]: QrCode,
  [PaymentMethodType.CASH]: Banknote,
};

export function RequestForm({
  type,
  methods,
  uploadsEnabled,
  backHref,
}: {
  type: DocumentTypeDTO;
  methods: PaymentMethodDTO[];
  uploadsEnabled: boolean;
  /** The resident portal to return to after submitting or cancelling. */
  backHref: string;
}) {
  const refId = useId();
  const purposeId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  // `null` means "no explicit pick yet" and falls back to the first channel, so
  // we never have to sync a default into state from an effect.
  const [pickedMethod, setPickedMethod] = useState<PaymentMethodType | null>(
    null,
  );
  const [purpose, setPurpose] = useState("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  // A free document skips the whole payment step: no method, no proof, no fee
  // card. Only the basic request info (purpose) is collected.
  const isFree = type.fee <= 0;
  const method = pickedMethod ?? methods[0]?.type ?? null;

  const blobUrlRef = useRef<string | null>(null);
  const showBlob = (next: File | null) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (next) {
      const url = URL.createObjectURL(next);
      blobUrlRef.current = url;
      setPreview(url);
    } else {
      setPreview(null);
    }
  };
  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    [],
  );

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (next && !next.type.startsWith("image/")) {
      toast.error("The screenshot must be an image file.");
      return;
    }
    setFile(next);
    showBlob(next);
  };

  const activeMethod = methods.find((m) => m.type === method) ?? null;
  const isEwallet = method !== null && method !== PaymentMethodType.CASH;

  const submit = async () => {
    if (!isFree) {
      if (!method) return;
      if (isEwallet && !reference.trim()) {
        toast.error("Enter the reference number from your payment.");
        return;
      }
      if (isEwallet && !file) {
        toast.error("Attach a screenshot of your payment.");
        return;
      }
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.set("documentTypeId", type.id);
    if (purpose.trim()) fd.set("purpose", purpose.trim());
    if (!isFree && method) {
      fd.set("method", method);
      if (isEwallet) {
        fd.set("paymentReference", reference.trim());
        if (file) fd.set("proof", file);
      }
    }
    const result = await submitDocumentRequest(fd);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDoneRef(result.referenceNumber);
    toast.success("Request submitted.");
  };

  if (doneRef) {
    return (
      <SuccessView
        referenceNumber={doneRef}
        documentName={type.name}
        method={method}
        isFree={isFree}
        backHref={backHref}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to portal
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">{type.name}</h1>
        {type.description && (
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {type.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {turnaroundLabel(type.turnaroundDays)}
        </p>
      </header>

      <div className="mt-6 rounded-4xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">Fee</span>
          <span className="font-mono text-2xl font-semibold tabular-nums">
            {isFree ? "Free" : formatPeso(type.fee)}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Label htmlFor={purposeId}>
            What&apos;s it for?{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Input
            id={purposeId}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. for employment"
            disabled={submitting}
          />
        </div>

        {/* Payment — only when the document actually charges a fee. Free
            documents collect basic info only. */}
        {!isFree && (
          <>
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">How will you pay?</p>
              {methods.length === 0 ? (
                <p className="rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                  Online payment isn&apos;t set up yet. Please visit the barangay
                  hall to request this document.
                </p>
              ) : (
                <div
                  role="radiogroup"
                  aria-label="Payment method"
                  className="grid grid-cols-3 gap-2"
                >
                  {methods.map((m) => {
                    const Icon = METHOD_ICON[m.type];
                    const active = method === m.type;
                    return (
                      <button
                        key={m.type}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPickedMethod(m.type)}
                        disabled={submitting}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-3xl border px-2 py-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                          active
                            ? "border-primary bg-accent/50 text-foreground"
                            : "border-border text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                        {METHOD_LABELS[m.type]}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Channel details */}
            {activeMethod && isEwallet && (
              <EwalletDetails
                method={activeMethod}
                fee={type.fee}
                reference={reference}
                onReference={setReference}
                preview={preview}
                uploadsEnabled={uploadsEnabled}
                submitting={submitting}
                fileRef={fileRef}
                onPickFile={onPickFile}
                onRemove={() => {
                  setFile(null);
                  showBlob(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                refId={refId}
              />
            )}

            {activeMethod && !isEwallet && (
              <div className="mt-4 rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                {activeMethod.instructions ||
                  "Pay at the barangay hall. We'll process your document once payment is confirmed."}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <Button variant="outline" className="flex-1" asChild>
          <Link href={backHref}>Cancel</Link>
        </Button>
        <Button
          className="flex-1"
          onClick={submit}
          disabled={submitting || (!isFree && methods.length === 0)}
        >
          {submitting && <Spinner />}
          Submit request
        </Button>
      </div>
    </div>
  );
}

function EwalletDetails({
  method,
  fee,
  reference,
  onReference,
  preview,
  uploadsEnabled,
  submitting,
  fileRef,
  onPickFile,
  onRemove,
  refId,
}: {
  method: PaymentMethodDTO;
  fee: number;
  reference: string;
  onReference: (v: string) => void;
  preview: string | null;
  uploadsEnabled: boolean;
  submitting: boolean;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  refId: string;
}) {
  const label = METHOD_LABELS[method.type];
  return (
    <div className="mt-4 flex flex-col gap-5 rounded-3xl border border-border bg-muted/30 p-4 sm:p-5">
      {/* Who you're paying and the exact amount to send, side by side so a
          resident can confirm both before they open their wallet app. */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 text-sm">
        <div className="min-w-0">
          <p className="text-muted-foreground">Pay to</p>
          <p className="font-medium text-foreground">
            {method.accountName || label}
          </p>
          {method.accountNumber && (
            <p className="mt-0.5 font-mono text-foreground">
              {method.accountNumber}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Send exactly</p>
          <p className="font-mono text-lg font-semibold tabular-nums text-foreground">
            {formatPeso(fee)}
          </p>
        </div>
      </div>

      {/* The QR is the whole point of this step, so it gets real estate: a large
          centered code on white, tappable to open full-size for scanning from a
          second phone or saving to scan from the wallet app's gallery. */}
      {method.qrImage ? (
        <figure className="flex flex-col items-center gap-2.5">
          <a
            href={method.qrImage}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full max-w-[17rem] rounded-3xl border border-border bg-white p-3 shadow-sm ring-1 ring-foreground/5 outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={method.qrImage}
              alt={`${label} payment QR code for ${method.accountName || label}`}
              className="aspect-square w-full object-contain"
            />
          </a>
          <figcaption className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Maximize2 className="size-3.5" aria-hidden />
            Tap the code to enlarge, or save it and scan from your {label} app
          </figcaption>
        </figure>
      ) : (
        <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground text-pretty">
          No QR code yet. Send {formatPeso(fee)} to the {label} number above,
          then enter the reference number and a screenshot below.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={refId}>Reference number</Label>
        <Input
          id={refId}
          value={reference}
          onChange={(e) => onReference(e.target.value)}
          placeholder="e.g. 0123 4567 8901"
          inputMode="numeric"
          disabled={submitting}
          className="font-mono"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Screenshot of payment</Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickFile}
          disabled={submitting || !uploadsEnabled}
          className="sr-only"
          aria-label="Payment screenshot"
        />
        {preview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Your payment screenshot"
              className="size-20 rounded-2xl border border-border object-cover"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={submitting}
            >
              <Trash2 className="text-destructive" />
              Remove
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={submitting || !uploadsEnabled}
            className="flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border bg-background text-sm text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
          >
            <ImageUp className="size-5" aria-hidden />
            {uploadsEnabled ? "Upload screenshot" : "Uploads unavailable"}
          </button>
        )}
      </div>
    </div>
  );
}

function SuccessView({
  referenceNumber,
  documentName,
  method,
  isFree,
  backHref,
}: {
  referenceNumber: string;
  documentName: string;
  method: PaymentMethodType | null;
  isFree: boolean;
  backHref: string;
}) {
  const cash = !isFree && method === PaymentMethodType.CASH;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">
        Request submitted
      </h1>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground text-pretty">
        {isFree ? (
          <>
            We&apos;ll prepare your {documentName.toLowerCase()} and update its
            status in your portal.
          </>
        ) : (
          <>
            We&apos;ll check your payment for the {documentName.toLowerCase()}{" "}
            and update its status in your portal.
            {cash ? " Bring the fee to the barangay hall to complete it." : ""}
          </>
        )}
      </p>
      <div className="mt-5 rounded-3xl border border-border bg-muted/40 px-5 py-3">
        <p className="text-xs text-muted-foreground">Reference number</p>
        <p className="font-mono text-lg font-semibold tracking-tight">
          {referenceNumber}
        </p>
      </div>
      <Button asChild className="mt-6 w-full max-w-xs" size="lg">
        <Link href={backHref}>Back to portal</Link>
      </Button>
    </div>
  );
}
