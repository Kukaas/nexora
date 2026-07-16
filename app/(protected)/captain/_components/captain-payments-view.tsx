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
import {
  DocumentRequestStatus,
  PaymentMethodType,
} from "@/app/generated/prisma/enums";
import { METHOD_LABELS, METHOD_ORDER } from "@/lib/payments";
import type { AnalyticsRequestRow } from "@/lib/captain-data";
import {
  formatDate,
  formatPeso,
  MethodBadge,
  PaymentStateBadge,
} from "./captain-ui";
import {
  ChartCard,
  COLLECTIONS_CHART,
  DAY_MS,
  FilterTabs,
  Kpi,
  KpiStrip,
  PagerRow,
  TimeSeriesBars,
  VERIFIED_STATUSES,
  buildBuckets,
  downloadCsv,
} from "./captain-viz";

type PayState = "PENDING" | "VERIFIED" | "REJECTED";
type StateTab = "ALL" | PayState;

const STATE_LABELS: Record<PayState, string> = {
  PENDING: "Awaiting",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

function payStateOf(status: DocumentRequestStatus): PayState {
  if (status === DocumentRequestStatus.PENDING) return "PENDING";
  if (status === DocumentRequestStatus.REJECTED) return "REJECTED";
  return "VERIFIED";
}

/** Rows shown per page on screen; print always gets the whole view. */
const PAGE_SIZE = 25;

/**
 * The captain's read-only payments screen: every paid document request,
 * filterable by date, channel, and verification state, with the collections
 * chart and the same export/print controls as the overview. Verifying stays
 * with the treasurer.
 */
export function CaptainPaymentsView({
  requests,
  generatedAt,
  detailBasePath,
}: {
  requests: AnalyticsRequestRow[];
  generatedAt: number;
  /** Where a row's detail lives, e.g. `/captain/{id}/requests`. */
  detailBasePath: string;
}) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: "all" });
  const [methodFilter, setMethodFilter] = useState<"ALL" | PaymentMethodType>(
    "ALL",
  );
  const [stateFilter, setStateFilter] = useState<StateTab>("ALL");
  const [page, setPage] = useState(1);

  // Free documents carry no payment; the money view only shows paid ones.
  const paid = useMemo(() => requests.filter((r) => r.fee > 0), [requests]);

  const view = useMemo(() => {
    const { start, end } = dateBounds(dateFilter);
    const endMs = Math.min(end ?? generatedAt, generatedAt);
    const startMs =
      start ??
      (paid[0] ? new Date(paid[0].createdAt).getTime() : endMs - 30 * DAY_MS);

    const inRange = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= startMs && t <= endMs;
    };

    // Date + channel scope (by submission date): the tabs count within this.
    const scoped = paid.filter(
      (r) =>
        inRange(r.createdAt) &&
        (methodFilter === "ALL" || r.method === methodFilter),
    );

    const counts = new Map<PayState, number>();
    for (const r of scoped) {
      const s = payStateOf(r.status);
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }

    const rows =
      stateFilter === "ALL"
        ? scoped
        : scoped.filter((r) => payStateOf(r.status) === stateFilter);
    // Newest first for reading; `requests` arrives oldest-first for charting.
    const listed = [...rows].reverse();

    // Money is counted when the treasurer verified it, not when the resident
    // asked — so the chart and the verified KPI use reviewedAt, independent of
    // the state tab.
    const collectedRows = paid.filter(
      (r) =>
        (methodFilter === "ALL" || r.method === methodFilter) &&
        VERIFIED_STATUSES.includes(r.status) &&
        r.reviewedAt !== null &&
        inRange(r.reviewedAt),
    );

    const buckets = buildBuckets(startMs, endMs);
    const series = buckets.labels.map((label) => ({ label, amount: 0 }));
    for (const r of collectedRows) {
      const i = buckets.indexOf(r.reviewedAt!);
      if (i !== undefined) series[i].amount += r.fee;
    }

    const pendingRows = scoped.filter(
      (r) => r.status === DocumentRequestStatus.PENDING,
    );

    return {
      listed,
      series,
      counts,
      scopedTotal: scoped.length,
      totals: {
        pendingCount: pendingRows.length,
        pendingTotal: pendingRows.reduce((sum, r) => sum + r.fee, 0),
        collectedCount: collectedRows.length,
        collectedTotal: collectedRows.reduce((sum, r) => sum + r.fee, 0),
        rejectedCount: counts.get("REJECTED") ?? 0,
      },
    };
  }, [paid, dateFilter, methodFilter, stateFilter, generatedAt]);

  const tabs: { value: StateTab; label: string; count: number }[] = [
    { value: "ALL", label: "All", count: view.scopedTotal },
    ...(Object.keys(STATE_LABELS) as PayState[]).map((state) => ({
      value: state as StateTab,
      label: STATE_LABELS[state],
      count: view.counts.get(state) ?? 0,
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
    downloadCsv("payments", [
      [
        "Reference",
        "Document",
        "Resident",
        "Method",
        "Payment reference",
        "Amount",
        "Payment",
        "Submitted",
        "Reviewed",
        "Verified by",
      ],
      ...view.listed.map((r) => [
        r.referenceNumber,
        r.documentName,
        r.requesterName,
        METHOD_LABELS[r.method],
        r.paymentReference ?? "",
        r.fee.toFixed(2),
        STATE_LABELS[payStateOf(r.status)],
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
          value={methodFilter}
          onValueChange={(next) =>
            updateFilters(() =>
              setMethodFilter(next as "ALL" | PaymentMethodType),
            )
          }
        >
          <SelectTrigger
            className="w-full sm:w-44"
            aria-label="Filter by payment method"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All methods</SelectItem>
            {METHOD_ORDER.map((method) => (
              <SelectItem key={method} value={method}>
                {METHOD_LABELS[method]}
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
        {methodFilter === "ALL" ? "All methods" : METHOD_LABELS[methodFilter]}{" "}
        ·{" "}
        {stateFilter === "ALL"
          ? "All payments"
          : STATE_LABELS[stateFilter]}
      </p>

      <KpiStrip>
        <Kpi
          label="Awaiting verification"
          value={String(view.totals.pendingCount)}
          sub={`${formatPeso(view.totals.pendingTotal)} pending`}
        />
        <Kpi
          label="Collected"
          value={formatPeso(view.totals.collectedTotal)}
          sub={`${view.totals.collectedCount} verified`}
        />
        <Kpi
          label="Rejected"
          value={String(view.totals.rejectedCount)}
          sub="sent back"
        />
      </KpiStrip>

      <ChartCard
        title="Collections over time"
        caption="Fees verified by the treasurer per period, within this view."
      >
        <TimeSeriesBars
          series={view.series}
          config={COLLECTIONS_CHART}
          dataKey="amount"
          peso
        />
      </ChartCard>

      <div className="print:hidden">
        <FilterTabs
          options={tabs}
          value={stateFilter}
          onChange={(next) => updateFilters(() => setStateFilter(next))}
          ariaLabel="Filter payments by verification state"
        />
      </div>

      {view.listed.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No payments in this view</EmptyTitle>
            <EmptyDescription>
              No paid requests match these filters. Widen the date range or
              clear the filters to see more.
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
                    Method
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Reference
                  </TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Amount
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Payment
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Verified by
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
                        href={`${detailBasePath}/${r.id}`}
                        aria-label={`${r.documentName} payment from ${r.requesterName}`}
                        className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                      >
                        {r.documentName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.requesterName}
                    </TableCell>
                    <TableCell>
                      <MethodBadge method={r.method} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {r.paymentReference ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatPeso(r.fee)}
                    </TableCell>
                    <TableCell>
                      <PaymentStateBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.reviewedByName ? (
                        <span>
                          {r.reviewedByName}
                          {r.reviewedAt && (
                            <span className="block text-xs">
                              {formatDate(r.reviewedAt)}
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
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
                  href={`${detailBasePath}/${r.id}`}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {r.documentName}
                      </span>
                      <MethodBadge method={r.method} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {r.requesterName}
                    </p>
                    {r.paymentReference && (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {r.paymentReference}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="font-mono text-sm font-medium tabular-nums">
                      {formatPeso(r.fee)}
                    </span>
                    <PaymentStateBadge status={r.status} />
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
