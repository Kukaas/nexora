"use client";

import { useMemo, useState } from "react";
import { FileDown, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DateRangeFilter,
  dateBounds,
  dateFilterLabel,
  type DateFilter,
} from "@/components/date-range-filter";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { METHOD_LABELS, METHOD_ORDER } from "@/lib/payments";
import type { AnalyticsRequestRow } from "@/lib/captain-data";
import { formatPeso } from "./captain-ui";
import {
  BreakdownEmpty,
  BreakdownRow,
  ChartCard,
  COLLECTIONS_CHART,
  DAY_MS,
  Kpi,
  KpiStrip,
  REQUESTS_CHART,
  STATUS_META,
  TimeSeriesBars,
  VERIFIED_STATUSES,
  buildBuckets,
  downloadCsv,
  statusLabelOf,
} from "./captain-viz";

/**
 * The captain's analytics overview. All rows arrive from the server once;
 * filtering, bucketing, charting, and exporting happen here so every filter
 * change is instant.
 */
export function CaptainAnalytics({
  requests,
  residentJoinDates,
  generatedAt,
}: {
  requests: AnalyticsRequestRow[];
  residentJoinDates: string[];
  /** Server render time (ms); the stable "now" every range is clamped to. */
  generatedAt: number;
}) {
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    kind: "preset",
    preset: "MONTH",
  });
  const [docFilter, setDocFilter] = useState<string>("ALL");

  const documentNames = useMemo(
    () => [...new Set(requests.map((r) => r.documentName))].sort(),
    [requests],
  );

  const view = useMemo(() => {
    const { start, end } = dateBounds(dateFilter);
    const endMs = Math.min(end ?? generatedAt, generatedAt);
    // "All dates" starts at the first thing we know about, or shows an empty
    // month rather than an empty axis. Requests arrive sorted ascending;
    // resident join dates don't, so scan them.
    const firstKnown = residentJoinDates.reduce(
      (min, iso) => Math.min(min, new Date(iso).getTime()),
      requests[0] ? new Date(requests[0].createdAt).getTime() : Infinity,
    );
    const startMs =
      start ?? (Number.isFinite(firstKnown) ? firstKnown : endMs - 30 * DAY_MS);

    const inRange = (iso: string) => {
      const t = new Date(iso).getTime();
      return t >= startMs && t <= endMs;
    };

    const filtered = requests.filter(
      (r) =>
        (docFilter === "ALL" || r.documentName === docFilter) &&
        inRange(r.createdAt),
    );

    // Money is counted when the treasurer verified it, not when the resident
    // asked — so collections use reviewedAt and ignore the createdAt filter.
    const collectedRows = requests.filter(
      (r) =>
        (docFilter === "ALL" || r.documentName === docFilter) &&
        r.fee > 0 &&
        VERIFIED_STATUSES.includes(r.status) &&
        r.reviewedAt !== null &&
        inRange(r.reviewedAt),
    );

    const buckets = buildBuckets(startMs, endMs);
    const series = buckets.labels.map((label) => ({
      label,
      requests: 0,
      amount: 0,
    }));
    for (const r of filtered) {
      const i = buckets.indexOf(r.createdAt);
      if (i !== undefined) series[i].requests += 1;
    }
    for (const r of collectedRows) {
      const i = buckets.indexOf(r.reviewedAt!);
      if (i !== undefined) series[i].amount += r.fee;
    }

    const statusCounts = new Map<DocumentRequestStatus, number>();
    const byDocument = new Map<string, number>();
    const byMethod = new Map<string, { count: number; amount: number }>();
    for (const r of filtered) {
      statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
      byDocument.set(r.documentName, (byDocument.get(r.documentName) ?? 0) + 1);
      if (r.fee > 0) {
        const m = byMethod.get(r.method) ?? { count: 0, amount: 0 };
        m.count += 1;
        m.amount += r.fee;
        byMethod.set(r.method, m);
      }
    }

    const topDocuments = [...byDocument.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    const pending = filtered.filter(
      (r) => r.status === DocumentRequestStatus.PENDING && r.fee > 0,
    );

    return {
      filtered,
      series,
      statusCounts,
      topDocuments,
      methods: METHOD_ORDER.map((m) => ({
        method: m,
        ...(byMethod.get(m) ?? { count: 0, amount: 0 }),
      })),
      totals: {
        requests: filtered.length,
        collectedTotal: collectedRows.reduce((sum, r) => sum + r.fee, 0),
        collectedCount: collectedRows.length,
        pendingCount: pending.length,
        pendingTotal: pending.reduce((sum, r) => sum + r.fee, 0),
        newResidents: residentJoinDates.filter(inRange).length,
      },
    };
  }, [requests, residentJoinDates, dateFilter, docFilter, generatedAt]);

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
      ],
      ...view.filtered.map((r) => [
        r.referenceNumber,
        r.documentName,
        r.requesterName,
        METHOD_LABELS[r.method],
        r.fee.toFixed(2),
        statusLabelOf(r.status),
        r.createdAt.slice(0, 10),
        r.reviewedAt?.slice(0, 10) ?? "",
      ]),
    ]);
  }

  const maxStatus = Math.max(
    1,
    ...STATUS_META.map((m) => view.statusCounts.get(m.status) ?? 0),
  );
  const maxDocument = Math.max(1, ...view.topDocuments.map(([, n]) => n));
  const maxMethod = Math.max(1, ...view.methods.map((m) => m.count));

  return (
    <div className="flex flex-col gap-6">
      {/* Filters + exports. Everything below reacts to this row. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:hidden">
        <DateRangeFilter
          value={dateFilter}
          onChange={setDateFilter}
          align="start"
        />
        <Select value={docFilter} onValueChange={setDocFilter}>
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
        {docFilter === "ALL" ? "All documents" : docFilter}
      </p>

      <KpiStrip>
        <Kpi
          label="Requests"
          value={String(view.totals.requests)}
          sub="submitted"
        />
        <Kpi
          label="Collected"
          value={formatPeso(view.totals.collectedTotal)}
          sub={`${view.totals.collectedCount} verified`}
        />
        <Kpi
          label="Awaiting verification"
          value={String(view.totals.pendingCount)}
          sub={`${formatPeso(view.totals.pendingTotal)} pending`}
        />
        <Kpi
          label="New residents"
          value={String(view.totals.newResidents)}
          sub="registered"
        />
      </KpiStrip>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard
          title="Requests over time"
          caption="Document requests submitted per period."
        >
          <TimeSeriesBars
            series={view.series}
            config={REQUESTS_CHART}
            dataKey="requests"
          />
        </ChartCard>

        <ChartCard
          title="Collections over time"
          caption="Document fees verified by the treasurer per period."
        >
          <TimeSeriesBars
            series={view.series}
            config={COLLECTIONS_CHART}
            dataKey="amount"
            peso
          />
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard
          title="Requests by status"
          caption="Where every request in this view stands."
        >
          <ul className="flex flex-col gap-3">
            {STATUS_META.map(({ status, label, bar }) => (
              <BreakdownRow
                key={status}
                label={label}
                value={view.statusCounts.get(status) ?? 0}
                max={maxStatus}
                barClass={bar}
              />
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Top documents"
          caption="The most requested document types."
        >
          {view.topDocuments.length === 0 ? (
            <BreakdownEmpty />
          ) : (
            <ul className="flex flex-col gap-3">
              {view.topDocuments.map(([name, count]) => (
                <BreakdownRow
                  key={name}
                  label={name}
                  value={count}
                  max={maxDocument}
                  barClass="bg-accent-foreground dark:bg-primary"
                />
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard
          title="Payment methods"
          caption="How residents paid their document fees."
        >
          {view.methods.every((m) => m.count === 0) ? (
            <BreakdownEmpty />
          ) : (
            <ul className="flex flex-col gap-3">
              {view.methods.map(({ method, count, amount }) => (
                <BreakdownRow
                  key={method}
                  label={METHOD_LABELS[method]}
                  value={count}
                  max={maxMethod}
                  barClass="bg-emerald-600 dark:bg-emerald-400"
                  sub={count > 0 ? formatPeso(amount) : undefined}
                />
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
