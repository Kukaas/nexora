"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { requestHasPayment, type DocumentRequestDTO } from "@/lib/documents";
import { formatPeso, MethodBadge, RequestStatusBadge } from "./secretary-ui";

type Filter = "ALL" | DocumentRequestStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: DocumentRequestStatus.PROCESSING, label: "To prepare" },
  { value: DocumentRequestStatus.PENDING, label: "Awaiting payment" },
  { value: DocumentRequestStatus.READY, label: "Ready" },
  { value: DocumentRequestStatus.REJECTED, label: "Rejected" },
  { value: "ALL", label: "All" },
];

export function RequestsReview({
  requests,
  basePath,
}: {
  requests: DocumentRequestDTO[];
  /** Detail route prefix, e.g. `/secretary/{id}/requests`. */
  basePath: string;
}) {
  const [filter, setFilter] = useState<Filter>(DocumentRequestStatus.PROCESSING);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      ALL: requests.length,
      [DocumentRequestStatus.PENDING]: 0,
      [DocumentRequestStatus.PROCESSING]: 0,
      [DocumentRequestStatus.READY]: 0,
      [DocumentRequestStatus.REJECTED]: 0,
    };
    for (const r of requests) base[r.status] += 1;
    return base;
  }, [requests]);

  const visible = useMemo(
    () =>
      filter === "ALL"
        ? requests
        : requests.filter((r) => r.status === filter),
    [requests, filter],
  );

  return (
    <section aria-label="Document requests">
      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter requests by status"
        className="flex w-full gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "bg-border/70 text-muted-foreground",
                )}
              >
                {counts[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <EmptyFilterState filter={filter} />
      ) : (
        <ul className="mt-5 divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card">
          {visible.map((r) => (
            <li key={r.id}>
              <Link
                href={`${basePath}/${r.id}`}
                className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {r.documentName}
                    </span>
                    {requestHasPayment(r) && (
                      <MethodBadge
                        method={r.method}
                        className="hidden sm:inline-flex"
                      />
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {r.requesterName}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {r.referenceNumber}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="font-mono text-sm font-medium tabular-nums">
                    {requestHasPayment(r) ? formatPeso(r.fee) : "Free"}
                  </span>
                  <RequestStatusBadge status={r.status} />
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyFilterState({ filter }: { filter: Filter }) {
  const copy: Record<Filter, { title: string; description: string }> = {
    [DocumentRequestStatus.PENDING]: {
      title: "Nothing awaiting payment",
      description:
        "Requests whose payment the treasurer hasn't verified yet wait here.",
    },
    [DocumentRequestStatus.PROCESSING]: {
      title: "Nothing to prepare",
      description:
        "Once the treasurer verifies a payment, the request lands here for you to prepare.",
    },
    [DocumentRequestStatus.READY]: {
      title: "No documents ready",
      description:
        "Documents you mark ready show up here for residents to claim.",
    },
    [DocumentRequestStatus.REJECTED]: {
      title: "No rejected requests",
      description:
        "Requests the treasurer sent back over payment appear here with their reason.",
    },
    ALL: {
      title: "No requests yet",
      description:
        "Once residents start requesting documents, every request shows up here.",
    },
  };
  const { title, description } = copy[filter];
  return (
    <Empty className="mt-5 rounded-4xl border border-dashed border-border bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
