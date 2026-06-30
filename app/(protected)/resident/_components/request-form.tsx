"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Banknote,
  CalendarIcon,
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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethodType } from "@/app/generated/prisma/enums";
import { METHOD_LABELS, type PaymentMethodDTO } from "@/lib/payments";
import {
  turnaroundLabel,
  type DocumentField,
  type DocumentTypeDTO,
} from "@/lib/documents";
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneRef, setDoneRef] = useState<string | null>(null);

  // A free document skips the whole payment step: no method, no proof, no fee
  // card. Only the basic request info (purpose) is collected.
  const isFree = type.fee <= 0;
  const method = pickedMethod ?? methods[0]?.type ?? null;
  const noChannels = !isFree && methods.length === 0;

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

  const setAnswer = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const submit = async () => {
    // Required custom fields must be answered before anything else.
    for (const field of type.fields) {
      if (field.required && !(answers[field.id] ?? "").trim()) {
        toast.error(`Please fill in "${field.label}".`);
        return;
      }
    }
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
    if (type.fields.length > 0) fd.set("fields", JSON.stringify(answers));
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

  const actions = (
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" size="lg" asChild>
        <Link href={backHref}>Cancel</Link>
      </Button>
      <Button
        className="flex-1"
        size="lg"
        onClick={submit}
        disabled={submitting || noChannels}
      >
        {submitting && <Spinner />}
        Submit request
      </Button>
    </div>
  );

  const detailsCard = (
    <div className="rounded-4xl border border-border bg-card p-5 sm:p-6 lg:col-span-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">Fee</span>
        <span className="font-mono text-2xl font-semibold tabular-nums">
          {isFree ? "Free" : formatPeso(type.fee)}
        </span>
      </div>

      {type.fields.length > 0 && (
        <div className="mt-5 flex flex-col gap-4">
          {type.fields.map((field) => (
            <FieldInput
              key={field.id}
              field={field}
              value={answers[field.id] ?? ""}
              onChange={(value) => setAnswer(field.id, value)}
              disabled={submitting}
            />
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Label htmlFor={purposeId}>
          What&apos;s it for?{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id={purposeId}
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g. for employment"
          disabled={submitting}
        />
      </div>

      {noChannels && (
        <p className="mt-5 rounded-3xl bg-muted px-4 py-3 text-sm text-muted-foreground text-pretty">
          Online payment isn&apos;t set up yet. Please visit the barangay hall to
          request this document.
        </p>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-5xl">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to portal
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {type.name}
        </h1>
        {type.description && (
          <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">
            {type.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {turnaroundLabel(type.turnaroundDays)}
        </p>
      </header>

      {/* Free documents and the "no online payment" fallback have nothing to pay,
          so they stay a single narrow column. A paid request opens into a
          two-column page on large screens: the form on the left, a sticky "How
          to pay" panel with a large, scannable QR on the right. On small screens
          the same blocks stack in payment order: pick a channel, see the QR,
          then enter the reference and proof. */}
      {isFree || noChannels ? (
        <div className="mt-6 space-y-6">
          {detailsCard}
          {actions}
        </div>
      ) : (
        <div className="mt-6 grid gap-x-6 gap-y-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {detailsCard}

          <div className="lg:col-start-1 lg:row-start-2">
            <p className="mb-2 text-sm font-medium">How will you pay?</p>
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
          </div>

          {/* How to pay — the sticky right column on large screens. */}
          <aside
            className={cn(
              "lg:col-start-2 lg:row-start-2 lg:self-start lg:sticky lg:top-6",
              isEwallet ? "lg:row-span-3" : "lg:row-span-2",
            )}
          >
            {activeMethod && isEwallet ? (
              <PaymentPanel method={activeMethod} fee={type.fee} />
            ) : (
              <CashPanel method={activeMethod} fee={type.fee} />
            )}
          </aside>

          {/* Proof inputs — left column, after the QR in source order. */}
          {isEwallet && (
            <div className="space-y-5 lg:col-start-1 lg:row-start-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={refId}>Reference number</Label>
                <Input
                  id={refId}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
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
                  <div className="flex flex-col items-center gap-3">
                    {/* Contain, don't crop: a payment screenshot is usually a
                        tall receipt, so object-cover would hide most of it. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Your payment screenshot"
                      className="h-40 w-auto max-w-[10rem] rounded-2xl border border-border bg-muted object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        showBlob(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
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
          )}

          <div
            className={cn(
              "lg:col-start-1",
              isEwallet ? "lg:row-start-4" : "lg:row-start-3",
            )}
          >
            {actions}
          </div>
        </div>
      )}
    </div>
  );
}

/** One custom field on the request form, rendered to match its configured type. */
function FieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: DocumentField;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = useId();
  const [dateOpen, setDateOpen] = useState(false);
  const label = (
    <Label htmlFor={id}>
      {field.label}{" "}
      {!field.required && (
        <span className="font-normal text-muted-foreground">(optional)</span>
      )}
    </Label>
  );

  if (field.type === "date") {
    // Values are stored as "yyyy-MM-dd"; parse at local midnight so the date
    // never drifts a day across time zones.
    const selected = value ? new Date(`${value}T00:00:00`) : undefined;
    const valid = selected && !Number.isNaN(selected.getTime());
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-9 w-full justify-start rounded-3xl bg-input/50 px-3 font-normal hover:bg-input/50",
                !valid && "text-muted-foreground",
              )}
            >
              <CalendarIcon
                className="size-4 text-muted-foreground"
                aria-hidden
              />
              {valid ? format(selected, "PPP") : `Select ${field.label.toLowerCase()}`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={valid ? selected : undefined}
              onSelect={(date) => {
                onChange(date ? format(date, "yyyy-MM-dd") : "");
                setDateOpen(false);
              }}
              captionLayout="dropdown"
              startMonth={new Date(1920, 0)}
              endMonth={new Date()}
              defaultMonth={valid ? selected : new Date(2000, 0)}
              disabled={{ after: new Date() }}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="flex flex-col gap-2">
        {label}
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {label}
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={field.type === "number" ? "numeric" : undefined}
        disabled={disabled}
      />
    </div>
  );
}

/** The e-wallet "how to pay" panel: who to pay, the exact amount, and a large
    QR the resident can scan from a second phone or save to scan from the wallet
    app's gallery. */
function PaymentPanel({
  method,
  fee,
}: {
  method: PaymentMethodDTO;
  fee: number;
}) {
  const label = METHOD_LABELS[method.type];
  return (
    <div className="rounded-4xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6">
      <p className="text-sm font-medium">How to pay</p>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 text-sm">
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

      {method.qrImage ? (
        <figure className="mt-5 flex flex-col items-center gap-3">
          <a
            href={method.qrImage}
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full max-w-[18rem] rounded-3xl border border-border bg-white p-3 outline-none transition-shadow hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={method.qrImage}
              alt={`${label} payment QR code for ${method.accountName || label}`}
              className="aspect-square w-full object-contain"
            />
          </a>
          <figcaption className="inline-flex items-center gap-1.5 text-center text-xs text-muted-foreground text-pretty">
            <Maximize2 className="size-3.5 shrink-0" aria-hidden />
            Tap the code to enlarge, or save it and scan from your {label} app
          </figcaption>
        </figure>
      ) : (
        <p className="mt-5 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground text-pretty">
          No QR code yet. Send {formatPeso(fee)} to the {label} number above,
          then enter the reference number and a screenshot.
        </p>
      )}
    </div>
  );
}

/** The cash "how to pay" panel: settle in person at the hall, with the amount
    due shown so the resident knows what to bring. */
function CashPanel({
  method,
  fee,
}: {
  method: PaymentMethodDTO | null;
  fee: number;
}) {
  return (
    <div className="rounded-4xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 sm:p-6">
      <p className="text-sm font-medium">Pay at the hall</p>
      <p className="mt-3 text-sm text-muted-foreground text-pretty">
        {method?.instructions ||
          "Pay at the barangay hall. We'll process your document once payment is confirmed."}
      </p>
      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4 text-sm">
        <span className="text-muted-foreground">Amount due</span>
        <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
          {formatPeso(fee)}
        </span>
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
