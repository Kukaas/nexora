"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileDown, Inbox, Printer } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCard } from "@/components/ui/data-table";
import {
  DateRangeFilter,
  dateBounds,
  dateFilterLabel,
  type DateFilter,
} from "@/components/date-range-filter";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { METHOD_LABELS } from "@/lib/payments";
import type { AnalyticsRequestRow } from "@/lib/captain-data";
import { formatDate, formatPeso, RequestStatusBadge } from "./captain-ui";
import {
  ChartCard,
  DAY_MS,
  FilterTabs,
  Kpi,
  KpiStrip,
  PagerRow,
  REQUESTS_CHART,
  STATUS_META,
  TimeSeriesBars,
  buildBuckets,
  downloadCsv,
  statusLabelOf,
} from "./captain-viz";

type StatusTab = "ALL" | DocumentRequestStatus;

/** Rows shown per page on screen; print always gets the whole view. */
const PAGE_SIZE = 25;

/**
 * The captain's read-only requests screen: filter by date, document, and
 * status; chart the volume; export or print the view. Acting on a request
 * stays with the secretary and treasurer.
 */
export function CaptainRequestsView({
  requests,
  generatedAt,
  basePath,
}: {
  requests: AnalyticsRequestRow[];
  generatedAt: number;
  /** Detail route prefix, e.g. `/captain/{id}/requests`. */
  basePath: string;
}) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: "all" });
  const [docFilter, setDocFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusTab>("ALL");
  const [page, setPage] = useState(1);

  const documentNames = useMemo(
    () => [...new Set(requests.map((r) => r.documentName))].sort(),
    [requests],
  );

  const view = useMemo(() => {
    const { start, end } = dateBounds(dateFilter);
    const endMs = Math.min(end ?? generatedAt, generatedAt);
    const startMs =
      start ??
      (requests[0]
        ? new Date(requests[0].createdAt).getTime()
        : endMs - 30 * DAY_MS);

    // Date + document scope: the tabs count within this slice.
    const scoped = requests.filter((r) => {
      const t = new Date(r.createdAt).getTime();
      return (
        t >= startMs &&
        t <= endMs &&
        (docFilter === "ALL" || r.documentName === docFilter)
      );
    });

    const counts = new Map<DocumentRequestStatus, number>();
    for (const r of scoped) {
      counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    }

    const rows =
      statusFilter === "ALL"
        ? scoped
        : scoped.filter((r) => r.status === statusFilter);
    // Newest first for reading; `requests` arrives oldest-first for charting.
    const listed = [...rows].reverse();

    const buckets = buildBuckets(startMs, endMs);
    const series = buckets.labels.map((label) => ({ label, requests: 0 }));
    for (const r of rows) {
      const i = buckets.indexOf(r.createdAt);
      if (i !== undefined) series[i].requests += 1;
    }

    const paidRows = rows.filter((r) => r.fee > 0);

    return {
      listed,
      series,
      counts,
      scopedTotal: scoped.length,
      totals: {
        requests: rows.length,
        paidCount: paidRows.length,
        paidTotal: paidRows.reduce((sum, r) => sum + r.fee, 0),
        freeCount: rows.length - paidRows.length,
      },
    };
  }, [requests, dateFilter, docFilter, statusFilter, generatedAt]);

  const tabs: { value: StatusTab; label: string; count: number }[] = [
    { value: "ALL", label: "All", count: view.scopedTotal },
    ...STATUS_META.map(({ status, label }) => ({
      value: status as StatusTab,
      label,
      count: view.counts.get(status) ?? 0,
    })),
  ];

  const pageCount = Math.max(1, Math.ceil(view.listed.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const onPage = (index: number) =>
    index >= pageStart && index < pageStart + PAGE_SIZE;

  function updateFilters(apply: () => void) {
    apply();
    setPage(1);
  }

  function handleExport() {
    downloadCsv("requests", [
      [
        "Reference",
        "Document",
        "Resident",
        "Method",
        "Fee",
        "Status",
        "Submitted",
        "Payment reviewed",
        "Handled by",
      ],
      ...view.listed.map((r) => [
        r.referenceNumber,
        r.documentName,
        r.requesterName,
        METHOD_LABELS[r.method],
        r.fee.toFixed(2),
        statusLabelOf(r.status),
        r.createdAt.slice(0, 10),
        r.reviewedAt?.slice(0, 10) ?? "",
        r.reviewedByName ?? "",
      ]),
    ]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:hidden">
        <DateRangeFilter
          value={dateFilter}
          onChange={(next) => updateFilters(() => setDateFilter(next))}
          align="start"
        />
        <Select
          value={docFilter}
          onValueChange={(next) => updateFilters(() => setDocFilter(next))}
        >
          <SelectTrigger
            className="w-full sm:w-56"
            aria-label="Filter by document type"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All documents</SelectItem>
            {documentNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" onClick={handleExport}>
            <FileDown aria-hidden />
            Export Excel (CSV)
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer aria-hidden />
            Print
          </Button>
        </div>
      </div>

      {/* What's on screen, for the printed copy. */}
      <p className="hidden text-sm text-muted-foreground print:block">
        {dateFilterLabel(dateFilter)} ·{" "}
        {docFilter === "ALL" ? "All documents" : docFilter} ·{" "}
        {statusFilter === "ALL" ? "All statuses" : statusLabelOf(statusFilter)}
      </p>

      <KpiStrip>
        <Kpi
          label="Requests in view"
          value={String(view.totals.requests)}
          sub="submitted"
        />
        <Kpi
          label="With fees"
          value={String(view.totals.paidCount)}
          sub={`${formatPeso(view.totals.paidTotal)} total`}
        />
        <Kpi
          label="Free of charge"
          value={String(view.totals.freeCount)}
          sub="no fee"
        />
      </KpiStrip>

      <ChartCard
        title="Requests over time"
        caption="Requests in this view, per period."
      >
        <TimeSeriesBars
          series={view.series}
          config={REQUESTS_CHART}
          dataKey="requests"
        />
      </ChartCard>

      <div className="print:hidden">
        <FilterTabs
          options={tabs}
          value={statusFilter}
          onChange={(next) => updateFilters(() => setStatusFilter(next))}
          ariaLabel="Filter requests by status"
        />
      </div>

      {view.listed.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>Nothing in this view</EmptyTitle>
            <EmptyDescription>
              No requests match these filters. Widen the date range or clear
              the filters to see more.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Table — tablet and up. Off-page rows stay in the DOM, hidden on
              screen, so printing captures the whole filtered view. */}
          <TableCard className="hidden md:block print:block">
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
                    Submitted
                  </TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Fee
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Handled by
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5 print:hidden" aria-label="Open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.listed.map((r, index) => (
                  <TableRow
                    key={r.id}
                    className={cn(
                      "group relative cursor-pointer",
                      !onPage(index) && "hidden print:table-row",
                    )}
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
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {r.fee > 0 ? formatPeso(r.fee) : "Free"}
                    </TableCell>
                    <TableCell>
                      <RequestStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.reviewedByName ?? "—"}
                    </TableCell>
                    <TableCell className="pe-5 text-right print:hidden">
                      <ChevronRight
                        className="ml-auto size-4 text-muted-foreground/70 transition-colors group-hover:text-foreground"
                        aria-hidden
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {/* Stacked rows — phones */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden print:hidden">
            {view.listed.map((r, index) => (
              <li key={r.id} className={cn(!onPage(index) && "hidden")}>
                <Link
                  href={`${basePath}/${r.id}`}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.documentName}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {r.requesterName}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {r.referenceNumber} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-mono text-sm font-medium tabular-nums">
                      {r.fee > 0 ? formatPeso(r.fee) : "Free"}
                    </span>
                    <RequestStatusBadge status={r.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <PagerRow
            page={safePage}
            pageCount={pageCount}
            from={pageStart + 1}
            to={Math.min(pageStart + PAGE_SIZE, view.listed.length)}
            total={view.listed.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
