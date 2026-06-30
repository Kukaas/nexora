"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Inbox } from "lucide-react";

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
import { DataPagination, TableCard } from "@/components/ui/data-table";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import {
  requestHasPayment,
  type RequestPage,
  type RequestStatusCounts,
} from "@/lib/documents";
import { formatPeso, MethodBadge, RequestStatusBadge } from "./secretary-ui";
import {
  DateRangeFilter,
  dateBounds,
  type DateFilter,
} from "@/components/date-range-filter";
import { fetchRequestCounts, fetchRequestsPage } from "./requests-actions";

type Filter = "ALL" | DocumentRequestStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: DocumentRequestStatus.PROCESSING, label: "To prepare" },
  { value: DocumentRequestStatus.PENDING, label: "Awaiting payment" },
  { value: DocumentRequestStatus.READY, label: "Ready" },
  { value: DocumentRequestStatus.CLAIMED, label: "Claimed" },
  { value: DocumentRequestStatus.REJECTED, label: "Rejected" },
  { value: "ALL", label: "All" },
];

/** The status the page server-renders first; the table opens on this tab. */
const DEFAULT_STATUS: Filter = DocumentRequestStatus.PROCESSING;

/** Selectable page sizes for the requests table. */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const boundsToISO = (filter: DateFilter) => {
  const { start, end } = dateBounds(filter);
  return {
    start: start === null ? null : new Date(start).toISOString(),
    end: end === null ? null : new Date(end).toISOString(),
  };
};

const keyOf = (
  status: Filter,
  start: string | null,
  end: string | null,
  size: number,
  page: number,
) => `${status}|${start ?? ""}|${end ?? ""}|${size}|${page}`;

export function RequestsTable({
  basePath,
  pageSize: initialPageSize,
  initialPages,
  initialCounts,
}: {
  /** Detail route prefix, e.g. `/secretary/{id}/requests`. */
  basePath: string;
  /** Page size the server used to prepare `initialPages`. */
  pageSize: number;
  /** Server-prepared first pages of the default view (page 1, then page 2). */
  initialPages: RequestPage[];
  initialCounts: RequestStatusCounts;
}) {
  const [status, setStatus] = useState<Filter>(DEFAULT_STATUS);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: "all" });
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [current, setCurrent] = useState<RequestPage>(initialPages[0]);
  const [counts, setCounts] = useState<RequestStatusCounts>(initialCounts);
  const [pending, startTransition] = useTransition();

  // Seed the cache once with the pages the server already prepared, so paging
  // forward the first time is instant and never hits the network.
  const cacheRef = useRef<Map<string, RequestPage> | null>(null);
  if (cacheRef.current === null) {
    cacheRef.current = new Map(
      initialPages.map((p) => [
        keyOf(DEFAULT_STATUS, null, null, initialPageSize, p.page),
        p,
      ]),
    );
  }
  const cache = cacheRef.current;

  // Quietly warm the next page in the background so the next click is instant.
  // Page size is threaded through (not read from state) to stay correct mid
  // update, e.g. right after the secretary changes "rows per page".
  const prefetch = useCallback(
    (
      s: Filter,
      start: string | null,
      end: string | null,
      size: number,
      page: number,
    ) => {
      if (page < 1) return;
      const key = keyOf(s, start, end, size, page);
      if (cache.has(key)) return;
      void fetchRequestsPage({
        status: s,
        start,
        end,
        page,
        pageSize: size,
      }).then((result) => cache.set(key, result));
    },
    [cache],
  );

  // Show a page: from cache when we have it, otherwise fetch it. Either way,
  // warm the page after it.
  const showPage = useCallback(
    (
      s: Filter,
      start: string | null,
      end: string | null,
      size: number,
      page: number,
    ) => {
      const key = keyOf(s, start, end, size, page);
      const cached = cache.get(key);
      if (cached) {
        setCurrent(cached);
        if (page < cached.pageCount) prefetch(s, start, end, size, page + 1);
        return;
      }
      startTransition(async () => {
        const result = await fetchRequestsPage({
          status: s,
          start,
          end,
          page,
          pageSize: size,
        });
        cache.set(key, result);
        setCurrent(result);
        if (page < result.pageCount) prefetch(s, start, end, size, page + 1);
      });
    },
    [cache, prefetch],
  );

  const handleStatus = (next: Filter) => {
    if (next === status) return;
    setStatus(next);
    const { start, end } = boundsToISO(dateFilter);
    showPage(next, start, end, pageSize, 1);
  };

  const handleDate = (next: DateFilter) => {
    setDateFilter(next);
    const { start, end } = boundsToISO(next);
    const key = keyOf(status, start, end, pageSize, 1);
    startTransition(async () => {
      const [pageResult, countResult] = await Promise.all([
        fetchRequestsPage({ status, start, end, page: 1, pageSize }),
        fetchRequestCounts(start, end),
      ]);
      cache.set(key, pageResult);
      setCurrent(pageResult);
      setCounts(countResult);
      if (pageResult.pageCount > 1) prefetch(status, start, end, pageSize, 2);
    });
  };

  const handlePageSize = (next: number) => {
    if (next === pageSize) return;
    setPageSize(next);
    const { start, end } = boundsToISO(dateFilter);
    showPage(status, start, end, next, 1);
  };

  const goTo = (page: number) => {
    const { start, end } = boundsToISO(dateFilter);
    showPage(status, start, end, pageSize, page);
  };

  const dateScoped = dateFilter.kind !== "all";
  const { total, page, pageCount, items, pageSize: shownSize } = current;
  const from = total === 0 ? 0 : (page - 1) * shownSize + 1;
  const to = Math.min(page * shownSize, total);

  return (
    <section aria-label="Document requests" className="flex flex-col gap-4">
      {/* Toolbar: status tabs + date range */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Filter requests by status"
          className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
        >
          {FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <button
                key={f.value}
                role="tab"
                aria-selected={active}
                onClick={() => handleStatus(f.value)}
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
                  {f.value === "ALL" ? counts.all : counts[f.value]}
                </span>
              </button>
            );
          })}
        </div>

        <DateRangeFilter value={dateFilter} onChange={handleDate} />
      </div>

      {total === 0 ? (
        dateScoped ? (
          <EmptyDateState />
        ) : (
          <EmptyFilterState filter={status} />
        )
      ) : (
        <>
          <div
            aria-busy={pending}
            className={cn(
              "transition-opacity",
              pending && "pointer-events-none opacity-60",
            )}
          >
            {/* Table — tablet and up */}
            <TableCard className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                      Document
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Resident
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Reference
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
                  {items.map((r) => {
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
                            {r.documentName}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.requesterName}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.referenceNumber}
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
            <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
              {items.map((r) => {
                const paid = requestHasPayment(r);
                return (
                  <li key={r.id}>
                    <Link
                      href={`${basePath}/${r.id}`}
                      className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {r.documentName}
                          </span>
                          {paid && <MethodBadge method={r.method} />}
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
                          {paid ? formatPeso(r.fee) : "Free"}
                        </span>
                        <RequestStatusBadge status={r.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <DataPagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            total={total}
            from={from}
            to={to}
            pending={pending}
            onPageChange={goTo}
            onPageSizeChange={handlePageSize}
          />
        </>
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
    [DocumentRequestStatus.CLAIMED]: {
      title: "Nothing claimed yet",
      description:
        "Once residents pick up their ready documents, the claimed ones land here.",
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
    <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
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

function EmptyDateState() {
  return (
    <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarDays />
        </EmptyMedia>
        <EmptyTitle>No requests in this period</EmptyTitle>
        <EmptyDescription>
          Nothing was requested in the selected dates. Try a wider range.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
