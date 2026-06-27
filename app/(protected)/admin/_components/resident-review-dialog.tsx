"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ExternalLink, IdCard, X } from "lucide-react";
import { toast } from "sonner";

import { reviewResident } from "@/lib/admin-actions";
import { IDType } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AccountStatusBadge,
  type AccountStatus,
} from "./account-status-badge";

const ID_TYPE_LABEL: Record<IDType, string> = {
  [IDType.DRIVER_LICENSE]: "Driver's license",
  [IDType.PASSPORT]: "Passport",
  [IDType.SSS]: "SSS ID",
  [IDType.GSIS]: "GSIS ID",
  [IDType.PRC]: "PRC ID",
  [IDType.OTHERS]: "Other government ID",
};

export type SubmittedId = {
  type: IDType;
  number: string;
  image: string;
};

export function ResidentReviewDialog({
  resident,
}: {
  resident: {
    id: string;
    name: string;
    email: string;
    status: AccountStatus;
    submittedId: SubmittedId;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<null | "approve" | "reject">(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: "approve" | "reject") => {
    setError(null);
    setPending(decision);
    const result = await reviewResident({ userId: resident.id, decision });
    setPending(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(
      decision === "approve"
        ? `${resident.name.split(" ")[0]} is now a verified resident`
        : `${resident.name.split(" ")[0]}'s ID was rejected`,
    );
    setOpen(false);
    router.refresh();
  };

  const isPending = pending !== null;
  // Already-approved residents are reviewed here mainly to view the ID; the
  // label nudges toward the still-needed action for those awaiting review.
  const triggerLabel = resident.status === "review" ? "Review" : "View ID";

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IdCard />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Review resident ID</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{resident.name}</span>{" "}
            <span className="font-mono break-all">{resident.email}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {ID_TYPE_LABEL[resident.submittedId.type]}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">
              {resident.submittedId.number}
            </p>
          </div>
          <AccountStatusBadge status={resident.status} className="shrink-0" />
        </div>

        {/* The uploaded ID photo. */}
        <a
          href={resident.submittedId.image}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block overflow-hidden rounded-2xl border border-border bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resident.submittedId.image}
            alt={`${resident.name}'s submitted ID`}
            className="max-h-72 w-full object-contain"
          />
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-xs font-medium text-foreground opacity-0 ring-1 ring-border transition-opacity group-hover:opacity-100">
            <ExternalLink className="size-3" aria-hidden />
            Open
          </span>
        </a>

        <p className="text-xs text-muted-foreground">
          Check that the photo is clear and the name and ID number match this
          resident before approving. Approving lets them request documents.
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => decide("reject")}
            disabled={isPending}
            className="text-destructive hover:text-destructive"
          >
            {pending === "reject" ? <Spinner /> : <X />}
            Reject
          </Button>
          <Button
            type="button"
            onClick={() => decide("approve")}
            disabled={isPending}
          >
            {pending === "approve" ? <Spinner /> : <Check />}
            Approve resident
          </Button>
        </div>

        <DialogClose className="sr-only">Close</DialogClose>
      </DialogContent>
    </Dialog>
  );
}
