"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
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
}: {
  requestId: string;
  status: DocumentRequestStatus;
  backHref: string;
  /** "Verify payment" for paid documents, "Approve request" for free ones. */
  verifyLabel: string;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<null | "VERIFIED" | "REJECTED">(null);

  const decided =
    status === DocumentRequestStatus.PROCESSING ||
    status === DocumentRequestStatus.READY;

  const submit = async (decision: "VERIFIED" | "REJECTED") => {
    if (decision === "REJECTED" && !note.trim()) {
      toast.error("Add a short reason so the resident knows what to fix.");
      return;
    }
    setPending(decision);
    const result = await reviewDocumentRequest({
      requestId,
      decision,
      note: decision === "REJECTED" ? note.trim() : undefined,
    });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      decision === "VERIFIED"
        ? "Verified. The secretary can prepare the document now."
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

  if (rejecting) {
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
              setRejecting(false);
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
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => setRejecting(true)}
        disabled={pending !== null}
      >
        {status === DocumentRequestStatus.REJECTED ? "Edit reason" : "Send back"}
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
  );
}
