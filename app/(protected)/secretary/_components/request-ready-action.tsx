"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { markRequestReady } from "@/lib/secretary-actions";

/**
 * Secretary's control on the request detail page. Payment review belongs to the
 * treasurer, so the secretary only acts on PROCESSING requests (payment already
 * verified) by marking them ready; every other state is read-only.
 */
export function RequestReadyAction({
  requestId,
  status,
  backHref,
}: {
  requestId: string;
  status: DocumentRequestStatus;
  backHref: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const markReady = async () => {
    setPending(true);
    const result = await markRequestReady({ requestId });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Marked ready. The resident can claim it now.");
    router.push(backHref);
    router.refresh();
  };

  if (status === DocumentRequestStatus.PROCESSING) {
    return (
      <Button className="w-full" onClick={markReady} disabled={pending}>
        {pending && <Spinner />}
        Mark ready
      </Button>
    );
  }

  const message =
    status === DocumentRequestStatus.READY
      ? "This document is ready for the resident to claim."
      : status === DocumentRequestStatus.REJECTED
        ? "The treasurer sent this back to the resident over the payment."
        : "Waiting for the treasurer to verify the payment.";

  return (
    <p className="text-center text-sm text-muted-foreground text-pretty">
      {message}
    </p>
  );
}
