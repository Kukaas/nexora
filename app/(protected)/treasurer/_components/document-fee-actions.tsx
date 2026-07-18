"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DocumentRequestStatus, PaymentMethodType } from "@/app/generated/prisma/enums";
import { METHOD_LABELS, METHOD_ORDER } from "@/lib/payments";
import { reviewDocumentRequest } from "@/lib/treasurer-actions";

/**
 * Treasurer's review controls on the document-fee detail page. The treasurer
 * owns the payment decision only: verifying hands the request to the secretary,
 * rejecting sends it back to the resident. Once a request has left PENDING /
 * REJECTED it's the secretary's to prepare, so there's nothing to act on here.
 */
export function DocumentFeeActions({
  requestId,
  status,
  backHref,
  verifyLabel,
  requiresOr,
  walkIn,
}: {
  requestId: string;
  status: DocumentRequestStatus;
  backHref: string;
  /** "Verify payment" for paid documents, "Approve request" for free ones. */
  verifyLabel: string;
  /** Paid requests must record an OR number before they can be verified. */
  requiresOr: boolean;
  /** A walk-in carries no payment yet: the treasurer records the method here. */
  walkIn: boolean;
}) {
  const router = useRouter();
  const orId = useId();
  const refId = useId();
  const [mode, setMode] = useState<"idle" | "verifying" | "rejecting">("idle");
  const [note, setNote] = useState("");
  const [orNumber, setOrNumber] = useState("");
  const [method, setMethod] = useState<PaymentMethodType>(
    PaymentMethodType.CASH,
  );
  const [reference, setReference] = useState("");
  const [pending, setPending] = useState<null | "VERIFIED" | "REJECTED">(null);

  const decided =
    status === DocumentRequestStatus.PROCESSING ||
    status === DocumentRequestStatus.READY;

  // For a walk-in payment, the treasurer records how it was settled at the desk.
  const recordsMethod = walkIn && requiresOr;
  const isEwallet = method !== PaymentMethodType.CASH;

  const submit = async (decision: "VERIFIED" | "REJECTED") => {
    if (decision === "REJECTED" && !note.trim()) {
      toast.error("Add a short reason so the resident knows what to fix.");
      return;
    }
    if (decision === "VERIFIED" && requiresOr && !orNumber.trim()) {
      toast.error("Enter the OR number to verify this payment.");
      return;
    }
    setPending(decision);
    const result = await reviewDocumentRequest({
      requestId,
      decision,
      note: decision === "REJECTED" ? note.trim() : undefined,
      orNumber:
        decision === "VERIFIED" && requiresOr ? orNumber.trim() : undefined,
      method:
        decision === "VERIFIED" && recordsMethod ? method : undefined,
      paymentReference:
        decision === "VERIFIED" && recordsMethod && isEwallet && reference.trim()
          ? reference.trim()
          : undefined,
    });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      decision === "VERIFIED"
        ? walkIn
          ? "Verified. The secretary can print and release the document now."
          : "Verified. The secretary can prepare the document now."
        : "Sent back to the resident.",
    );
    router.push(backHref);
    router.refresh();
  };

  if (decided) {
    return (
      <p className="text-center text-sm text-muted-foreground text-pretty">
        Payment verified. The secretary is preparing the document.
      </p>
    );
  }

  if (mode === "verifying") {
    return (
      <div className="flex flex-col gap-3">
        {recordsMethod && (
          <div className="flex flex-col gap-2">
            <Label>How did they pay?</Label>
            <div
              role="radiogroup"
              aria-label="Payment method"
              className="grid grid-cols-3 gap-2"
            >
              {METHOD_ORDER.map((m) => {
                const active = method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMethod(m)}
                    disabled={pending !== null}
                    className={cn(
                      "rounded-2xl border px-2 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                      active
                        ? "border-primary bg-accent/50 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {METHOD_LABELS[m]}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {recordsMethod && isEwallet && (
          <div className="flex flex-col gap-2">
            <Label htmlFor={refId}>
              Payment reference{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id={refId}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. 0123 4567 8901"
              inputMode="numeric"
              className="font-mono"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor={orId}>OR number</Label>
          <Input
            id={orId}
            autoFocus
            value={orNumber}
            onChange={(e) => setOrNumber(e.target.value)}
            placeholder="e.g. 0042817"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            The Official Receipt number issued for this payment.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setMode("idle");
              setOrNumber("");
              setReference("");
            }}
            disabled={pending !== null}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => submit("VERIFIED")}
            disabled={pending !== null}
          >
            {pending === "VERIFIED" && <Spinner />}
            {verifyLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "rejecting") {
    return (
      <div className="flex flex-col gap-3">
        <Textarea
          autoFocus
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What's wrong with this payment? e.g. the amount doesn't match the fee, or the reference number is unreadable."
          rows={3}
          aria-label="Reason for sending back"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setMode("idle");
              setNote("");
            }}
            disabled={pending !== null}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => submit("REJECTED")}
            disabled={pending !== null}
          >
            {pending === "REJECTED" && <Spinner />}
            Confirm send back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {/* A walk-in is settled in person at the desk, so there's nothing to send
          back — the treasurer just verifies and the document is ready to print. */}
      {!walkIn && (
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setMode("rejecting")}
          disabled={pending !== null}
        >
          {status === DocumentRequestStatus.REJECTED
            ? "Edit reason"
            : "Send back"}
        </Button>
      )}
      <Button
        className="flex-1"
        onClick={() => (requiresOr ? setMode("verifying") : submit("VERIFIED"))}
        disabled={pending !== null}
      >
        {pending === "VERIFIED" && <Spinner />}
        {verifyLabel}
      </Button>
    </div>
  );
}
