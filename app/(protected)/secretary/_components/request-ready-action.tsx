"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import {
  markRequestClaimed,
  markRequestReady,
} from "@/lib/secretary-actions";

/**
 * Secretary's control on the request detail page. Payment review belongs to the
 * treasurer, so the secretary acts after it: marking a verified (PROCESSING)
 * request ready, then marking a READY one claimed once the resident picks it up.
 * Every other state is read-only.
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

  const run = async (
    action: typeof markRequestReady,
    success: string,
  ) => {
    setPending(true);
    const result = await action({ requestId });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(success);
    router.push(backHref);
    router.refresh();
  };

  if (status === DocumentRequestStatus.PROCESSING) {
    return (
      <Button
        className="w-full"
        onClick={() =>
          run(markRequestReady, "Marked ready. The resident can claim it now.")
        }
        disabled={pending}
      >
        {pending && <Spinner />}
        Mark ready
      </Button>
    );
  }

  if (status === DocumentRequestStatus.READY) {
    return (
      <div className="flex flex-col gap-2">
        <Button
          className="w-full"
          onClick={() =>
            run(markRequestClaimed, "Marked as claimed by the resident.")
          }
          disabled={pending}
        >
          {pending && <Spinner />}
          Mark as claimed
        </Button>
        <p className="text-center text-xs text-muted-foreground text-pretty">
          Mark it claimed once the resident has picked up the document.
        </p>
      </div>
    );
  }

  const message =
    status === DocumentRequestStatus.CLAIMED
      ? "The resident has claimed this document."
      : status === DocumentRequestStatus.REJECTED
        ? "The treasurer sent this back to the resident over the payment."
        : "Waiting for the treasurer to verify the payment.";

  return (
    <p className="text-center text-sm text-muted-foreground text-pretty">
      {message}
    </p>
  );
}
