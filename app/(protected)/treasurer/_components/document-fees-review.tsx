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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataPagination,
  DEFAULT_PAGE_SIZE_OPTIONS,
  TableCard,
  useClientPagination,
} from "@/components/ui/data-table";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { requestHasPayment, type DocumentRequestDTO } from "@/lib/documents";
import {
  formatDateTime,
  formatPeso,
  MethodBadge,
  RequestStatusBadge,
} from "./treasurer-ui";

type Filter = "ALL" | DocumentRequestStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: DocumentRequestStatus.PENDING, label: "Pending" },
  { value: DocumentRequestStatus.PROCESSING, label: "Verified" },
  { value: DocumentRequestStatus.CLAIMED, label: "Claimed" },
  { value: DocumentRequestStatus.REJECTED, label: "Rejected" },
  { value: "ALL", label: "All" },
];

export function DocumentFeesReview({
  requests,
  basePath,
}: {
  requests: DocumentRequestDTO[];
  /** Detail route prefix, e.g. `/treasurer/{id}/payments`. */
  basePath: string;
}) {
  const [filter, setFilter] = useState<Filter>(DocumentRequestStatus.PENDING);

  const counts = useMemo(() => {
    const base: Record<Filter, number> = {
      ALL: requests.length,
      [DocumentRequestStatus.PENDING]: 0,
      [DocumentRequestStatus.PROCESSING]: 0,
      [DocumentRequestStatus.READY]: 0,
      [DocumentRequestStatus.CLAIMED]: 0,
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

  const pg = useClientPagination(visible, 10);

  const selectFilter = (next: Filter) => {
    setFilter(next);
    pg.setPage(1);
  };

  return (
    <section aria-label="Document fees">
      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Filter document fees by status"
        className="flex w-full gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
      >
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              role="tab"
              aria-selected={active}
              onClick={() => selectFilter(f.value)}
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
        <>
          {/* Table — tablet and up */}
          <TableCard className="mt-5 hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                    Resident
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Document
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Submitted
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Method
                  </TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Fee
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5" aria-label="Open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.visible.map((r) => {
                  const paid = requestHasPayment(r);
                  return (
                    <TableRow
                      key={r.id}
                      className="group relative cursor-pointer"
                    >
                      <TableCell className="ps-5 font-medium">
                        <Link
                          href={`${basePath}/${r.id}`}
                          aria-label={`${r.documentName} for ${r.requesterName}`}
                          className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                        >
                          {r.requesterName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.documentName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {formatDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        {paid ? (
                          <MethodBadge method={r.method} />
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {paid ? formatPeso(r.fee) : "Free"}
                      </TableCell>
                      <TableCell>
                        <RequestStatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="pe-5 text-right">
                        <ChevronRight
                          className="ml-auto size-4 text-muted-foreground/70 transition-colors group-hover:text-foreground"
                          aria-hidden
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>

          {/* Stacked rows — phones */}
          <ul className="mt-5 divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {pg.visible.map((r) => (
              <li key={r.id}>
                <Link
                  href={`${basePath}/${r.id}`}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {r.requesterName}
                      </span>
                      {requestHasPayment(r) && (
                        <MethodBadge
                          method={r.method}
                          className="hidden sm:inline-flex"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {r.documentName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(r.createdAt)}
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

          <div className="mt-5">
            <DataPagination
              page={pg.page}
              pageCount={pg.pageCount}
              pageSize={pg.pageSize}
              pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
              total={pg.total}
              from={pg.from}
              to={pg.to}
              onPageChange={pg.setPage}
              onPageSizeChange={pg.setPageSize}
            />
          </div>
        </>
      )}
    </section>
  );
}

function EmptyFilterState({ filter }: { filter: Filter }) {
  const copy: Record<Filter, { title: string; description: string }> = {
    [DocumentRequestStatus.PENDING]: {
      title: "Nothing to verify",
      description:
        "When residents pay for a document, their payment lines up here for your check.",
    },
    [DocumentRequestStatus.PROCESSING]: {
      title: "Nothing verified yet",
      description:
        "Payments you verify move to the secretary to prepare, and stay listed here.",
    },
    [DocumentRequestStatus.READY]: {
      title: "Nothing released yet",
      description:
        "Documents the secretary has released to residents appear here.",
    },
    [DocumentRequestStatus.CLAIMED]: {
      title: "Nothing claimed yet",
      description:
        "Documents residents have picked up from the secretary appear here.",
    },
    [DocumentRequestStatus.REJECTED]: {
      title: "No rejected payments",
      description: "Payments you send back appear here with their reason.",
    },
    ALL: {
      title: "No document fees yet",
      description:
        "Once residents start paying for documents, every payment shows up here.",
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
