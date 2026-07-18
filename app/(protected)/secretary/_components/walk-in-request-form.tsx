"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Printer,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentFieldInput } from "@/components/document-field-input";
import { turnaroundLabel, type DocumentTypeDTO } from "@/lib/documents";
import { createWalkInRequest } from "@/lib/secretary-actions";
import { formatPeso } from "./secretary-ui";

/**
 * The secretary encodes a document request at the desk for a resident without
 * an account. No payment is collected here: the request is created awaiting
 * payment, and the resident takes the reference number (printed slip, or
 * written on paper) to the treasurer to pay in cash or by e-wallet.
 */
export function WalkInRequestForm({
  types,
  basePath,
}: {
  /** Active, requestable document types with their custom fields. */
  types: DocumentTypeDTO[];
  /** The requests list route, e.g. `/secretary/{id}/requests`. */
  basePath: string;
}) {
  const typeId = useId();
  const purposeId = useId();

  const [pickedTypeId, setPickedTypeId] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{
    id: string;
    referenceNumber: string;
    documentName: string;
    fee: number;
  } | null>(null);

  const type = types.find((t) => t.id === pickedTypeId) ?? null;

  const pickType = (id: string) => {
    setPickedTypeId(id);
    // Answers belong to one type's fields; switching types starts fresh.
    setAnswers({});
  };

  const setAnswer = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const reset = () => {
    setDone(null);
    setPickedTypeId("");
    setPurpose("");
    setAnswers({});
  };

  const submit = async () => {
    if (!type) {
      toast.error("Choose which document the resident is requesting.");
      return;
    }
    for (const field of type.fields) {
      if (field.required && !(answers[field.id] ?? "").trim()) {
        toast.error(`Please fill in "${field.label}".`);
        return;
      }
    }
    setSubmitting(true);
    const result = await createWalkInRequest({
      documentTypeId: type.id,
      purpose: purpose.trim() || undefined,
      answers,
    });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Request created.");
    setDone({
      id: result.id,
      referenceNumber: result.referenceNumber,
      documentName: type.name,
      fee: type.fee,
    });
  };

  if (done) {
    return (
      <SuccessView
        {...done}
        basePath={basePath}
        onEncodeAnother={reset}
      />
    );
  }

  return (
    <div className="w-full">
      <Link
        href={basePath}
        className="inline-flex items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Document requests
      </Link>

      <header className="mt-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Walk-in request
        </h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground text-pretty">
          Encode a request for a resident without an account. They&apos;ll pay
          at the treasurer with the reference number you hand them.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="rounded-4xl border border-border bg-card p-5 sm:p-6 lg:col-span-2">
          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={typeId}>Document</Label>
              <Select
                value={pickedTypeId}
                onValueChange={pickType}
                disabled={submitting}
              >
                <SelectTrigger id={typeId} className="w-full">
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.fee > 0 ? formatPeso(t.fee) : "Free"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {type && (
                <p className="text-xs text-muted-foreground">
                  {turnaroundLabel(type.turnaroundDays)}
                </p>
              )}
            </div>

            {type?.fields.map((field) => (
              <div
                key={field.id}
                className={cn(field.type === "textarea" && "sm:col-span-2")}
              >
                <DocumentFieldInput
                  field={field}
                  value={answers[field.id] ?? ""}
                  onChange={(value) => setAnswer(field.id, value)}
                  disabled={submitting}
                />
              </div>
            ))}

            {type && (
              <div className="flex flex-col gap-2">
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
            )}
          </div>

          {type && (
            <div className="mt-6 flex gap-2 border-t border-border pt-5 sm:justify-end">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none sm:px-6"
                size="lg"
                asChild
              >
                <Link href={basePath}>Cancel</Link>
              </Button>
              <Button
                className="flex-1 sm:flex-none sm:px-8"
                size="lg"
                onClick={submit}
                disabled={submitting}
              >
                {submitting && <Spinner />}
                Create request
              </Button>
            </div>
          )}
        </div>

        {/* What happens next — so the desk flow is clear at a glance. */}
        <aside className="rounded-4xl border border-border bg-card p-5 sm:p-6 lg:sticky lg:top-20">
          {type && (
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-4">
              <span className="text-sm text-muted-foreground">Fee</span>
              <span className="font-mono text-2xl font-semibold tabular-nums">
                {type.fee > 0 ? formatPeso(type.fee) : "Free"}
              </span>
            </div>
          )}
          <p className="text-sm font-medium">How it works</p>
          <ol className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground">
            <Step n={1}>
              Take the resident&apos;s details and create the request.
            </Step>
            <Step n={2}>
              Hand them the printed payment slip — or write the reference number
              on paper — and send them to the treasurer to pay in cash or by
              e-wallet.
            </Step>
            <Step n={3}>
              Once the treasurer verifies the payment, the request lands in your
              &ldquo;To prepare&rdquo; queue to print and release.
            </Step>
          </ol>
        </aside>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
        {n}
      </span>
      <span className="text-pretty">{children}</span>
    </li>
  );
}

function SuccessView({
  id,
  referenceNumber,
  documentName,
  fee,
  basePath,
  onEncodeAnother,
}: {
  id: string;
  referenceNumber: string;
  documentName: string;
  fee: number;
  basePath: string;
  onEncodeAnother: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <CheckCircle2 className="size-7" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">
        Request created
      </h1>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground text-pretty">
        Send the resident to the treasurer with this reference number to pay
        {fee > 0 ? ` the ${formatPeso(fee)} fee` : ""} for the{" "}
        {documentName.toLowerCase()}.
      </p>
      <div className="mt-5 w-full rounded-3xl border border-border bg-muted/40 px-5 py-3">
        <p className="text-xs text-muted-foreground">Reference number</p>
        <p className="font-mono text-lg font-semibold tracking-tight">
          {referenceNumber}
        </p>
      </div>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <Button asChild size="lg">
          <Link href={`${basePath}/${id}/slip`}>
            <Printer />
            Print payment slip
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href={`${basePath}/${id}`}>
            <ExternalLink />
            Open request
          </Link>
        </Button>
        <Button variant="ghost" size="lg" onClick={onEncodeAnother}>
          <RotateCcw />
          Encode another
        </Button>
      </div>
    </div>
  );
}
