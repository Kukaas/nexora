"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Landmark,
  Search,
  SearchX,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DateRangeFilter,
  dateBounds,
  dateFilterLabel,
  type DateFilter,
} from "@/components/date-range-filter";
import type {
  COACollectionItemDTO,
  COAReportSummaryDTO,
} from "@/lib/financial-reports-data";
import { formatPeso } from "./treasurer-ui";

function generateCOACSVData(
  items: COACollectionItemDTO[],
  summary: COAReportSummaryDTO,
  periodLabel: string
): string {
  const dateStr = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines: string[] = [
    `REPUBLIC OF THE PHILIPPINES`,
    `BARANGAY LIBTANGIN - OFFICE OF THE BARANGAY TREASURER`,
    `COMMISSION ON AUDIT (COA) OFFICIAL STATEMENT OF COLLECTIONS AND DEPOSITS`,
    `Report Generated Date: ${dateStr}`,
    `Reporting Period: ${periodLabel}`,
    ``,
    `SUMMARY METRICS`,
    `Total Official Collections,PHP ${summary.totalGrossCollections.toFixed(2)}`,
    `Cash Collections,PHP ${summary.cashTotal.toFixed(2)}`,
    `GCash Digital Collections,PHP ${summary.gCashTotal.toFixed(2)}`,
    `Maya Digital Collections,PHP ${summary.mayaTotal.toFixed(2)}`,
    `Total Transactions / Receipts Issued,${summary.totalReceiptsCount}`,
    ``,
    `DETAILED COLLECTIONS LOG`,
    `OR / Ref No.,Payer Name,Document / Service Purpose,Payment Method,Amount (PHP),Date & Time,Status`,
  ];

  for (const item of items) {
    const formattedDate = new Date(item.date).toLocaleString("en-PH");
    const cleanPurpose = `"${(item.documentOrPurpose || "").replace(/"/g, '""')}"`;
    const cleanPayer = `"${(item.payerName || "").replace(/"/g, '""')}"`;
    lines.push(
      `"${item.orNumber}",${cleanPayer},${cleanPurpose},${item.method},${item.amount.toFixed(2)},"${formattedDate}",${item.status}`
    );
  }

  return lines.join("\n");
}

export interface COAReportViewProps {
  initialItems: COACollectionItemDTO[];
  initialSummary: COAReportSummaryDTO;
  basePath: string;
}

export function COAReportView({ initialItems }: COAReportViewProps) {
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: "all" });

  // Export Modal Dialog state — Default Date Filter is "This Month"
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateFilter, setExportDateFilter] = useState<DateFilter>({
    kind: "preset",
    preset: "MONTH",
  });
  const [exportMethod, setExportMethod] = useState("ALL");

  const activePeriodLabel = useMemo(() => {
    return dateFilterLabel(dateFilter);
  }, [dateFilter]);

  const filteredItems = useMemo(() => {
    const { start, end } = dateBounds(dateFilter);
    return initialItems.filter((item) => {
      if (methodFilter !== "ALL" && item.method !== methodFilter) return false;

      if (start !== null || end !== null) {
        const t = new Date(item.date).getTime();
        if (start !== null && t < start) return false;
        if (end !== null && t > end) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchOr = item.orNumber.toLowerCase().includes(q);
        const matchPayer = item.payerName.toLowerCase().includes(q);
        const matchDoc = item.documentOrPurpose.toLowerCase().includes(q);
        return matchOr || matchPayer || matchDoc;
      }
      return true;
    });
  }, [initialItems, methodFilter, dateFilter, search]);

  const pg = useClientPagination(filteredItems, 10);

  // Recalculate summary metrics for filtered set
  const summary: COAReportSummaryDTO = useMemo(() => {
    return filteredItems.reduce(
      (acc, curr) => {
        acc.totalGrossCollections += curr.amount;
        if (curr.method === "CASH") acc.cashTotal += curr.amount;
        if (curr.method === "GCASH") acc.gCashTotal += curr.amount;
        if (curr.method === "MAYA") acc.mayaTotal += curr.amount;
        acc.totalReceiptsCount += 1;
        return acc;
      },
      {
        totalGrossCollections: 0,
        cashTotal: 0,
        gCashTotal: 0,
        mayaTotal: 0,
        totalReceiptsCount: 0,
      }
    );
  }, [filteredItems]);

  // Compute items & summary for the Export Modal Preview
  const exportItems = useMemo(() => {
    const { start, end } = dateBounds(exportDateFilter);
    return initialItems.filter((item) => {
      if (exportMethod !== "ALL" && item.method !== exportMethod) return false;

      if (start !== null || end !== null) {
        const t = new Date(item.date).getTime();
        if (start !== null && t < start) return false;
        if (end !== null && t > end) return false;
      }
      return true;
    });
  }, [initialItems, exportDateFilter, exportMethod]);

  const exportSummary: COAReportSummaryDTO = useMemo(() => {
    return exportItems.reduce(
      (acc, curr) => {
        acc.totalGrossCollections += curr.amount;
        if (curr.method === "CASH") acc.cashTotal += curr.amount;
        if (curr.method === "GCASH") acc.gCashTotal += curr.amount;
        if (curr.method === "MAYA") acc.mayaTotal += curr.amount;
        acc.totalReceiptsCount += 1;
        return acc;
      },
      {
        totalGrossCollections: 0,
        cashTotal: 0,
        gCashTotal: 0,
        mayaTotal: 0,
        totalReceiptsCount: 0,
      }
    );
  }, [exportItems]);

  const executeExport = () => {
    const exportLabel = dateFilterLabel(exportDateFilter);
    const csvContent = generateCOACSVData(exportItems, exportSummary, exportLabel);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanLabel = exportLabel.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `COA_Official_Statement_Collections_${cleanLabel}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Commission on Audit (COA) Reports
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Official statement of daily and monthly barangay collections, official receipts (OR), document fees, and treasury deposits.
          </p>
        </div>

        {/* Triggers Export Date Selection Popup */}
        <Button
          onClick={() => setExportModalOpen(true)}
          className="rounded-2xl font-semibold shadow-sm shrink-0"
        >
          <Download className="mr-1.5 size-4" />
          Export COA Statement (CSV)
        </Button>
      </header>

      {/* Financial KPI Stat Bar Suite */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">Gross Collections</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight font-mono text-primary tabular-nums">
              {formatPeso(summary.totalGrossCollections)}
            </span>
          </dd>
        </div>

        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">Cash Collections</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground tabular-nums">
              {formatPeso(summary.cashTotal)}
            </span>
          </dd>
        </div>

        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">GCash Digital</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground tabular-nums">
              {formatPeso(summary.gCashTotal)}
            </span>
          </dd>
        </div>

        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">Maya Digital</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground tabular-nums">
              {formatPeso(summary.mayaTotal)}
            </span>
          </dd>
        </div>

        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">OR Receipts</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-foreground tabular-nums">
              {summary.totalReceiptsCount}
            </span>
            <span className="text-xs text-muted-foreground">records</span>
          </dd>
        </div>
      </dl>

      {/* Integrated Filters Toolbar Row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                pg.setPage(1);
              }}
              placeholder="Search OR #, reference number, payer name..."
              className="ps-9 pe-8 h-9 text-xs rounded-2xl bg-background border-border"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  pg.setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Standard Reusable Date Range Filter Popover */}
            <DateRangeFilter
              value={dateFilter}
              onChange={(next) => {
                setDateFilter(next);
                pg.setPage(1);
              }}
            />

            {/* Payment Method Filter */}
            <Select
              value={methodFilter}
              onValueChange={(v) => {
                setMethodFilter(v);
                pg.setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] text-xs rounded-2xl">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Channels</SelectItem>
                <SelectItem value="CASH">Cash Desk</SelectItem>
                <SelectItem value="GCASH">GCash Digital</SelectItem>
                <SelectItem value="MAYA">Maya Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table & Mobile Stacked List View */}
      {filteredItems.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No financial collection records found</EmptyTitle>
            <EmptyDescription>
              Check your search keywords or date period filters ({activePeriodLabel}).
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                    OR # / Ref Number
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Payer Name
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Document / Purpose
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Payment Method
                  </TableHead>
                  <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                    Amount (PHP)
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Date & Time
                  </TableHead>
                  <TableHead className="h-11 pe-5 text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.visible.map((item) => {
                  const dateStr = new Date(item.date).toLocaleString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="ps-5 font-mono text-xs font-semibold text-foreground">
                        {item.orNumber}
                      </TableCell>

                      <TableCell className="font-medium text-foreground">
                        {item.payerName}
                      </TableCell>

                      <TableCell className="text-muted-foreground font-medium">
                        {item.documentOrPurpose}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-full text-[11px] font-semibold ${
                            item.method === "CASH"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : item.method === "GCASH"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                              : "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20"
                          }`}
                        >
                          {item.method}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-mono font-semibold text-foreground tabular-nums">
                        {formatPeso(item.amount)}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {dateStr}
                      </TableCell>

                      <TableCell className="pe-5">
                        <Badge variant="outline" className="rounded-full text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>

          {/* Mobile Stacked List View */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden shadow-sm">
            {pg.visible.map((item) => {
              const dateStr = new Date(item.date).toLocaleString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <li key={item.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {item.orNumber}
                    </span>
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[11px] font-semibold ${
                        item.method === "CASH"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : item.method === "GCASH"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                          : "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20"
                      }`}
                    >
                      {item.method}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {item.payerName}
                    </span>
                    <span className="font-mono font-semibold text-sm tabular-nums text-foreground">
                      {formatPeso(item.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.documentOrPurpose}</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">{dateStr}</p>
                </li>
              );
            })}
          </ul>

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
      )}

      {/* Interactive Export Options Popup Dialog */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-md rounded-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <FileSpreadsheet className="size-5 text-primary" aria-hidden />
              Export COA Financial Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the reporting period and payment channel filters for your generated Commission on Audit (COA) CSV statement. Default is set to this month.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Reporting Date Range</Label>
              <DateRangeFilter
                value={exportDateFilter}
                onChange={setExportDateFilter}
                align="start"
                className="w-full justify-between"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Payment Channel</Label>
              <Select value={exportMethod} onValueChange={setExportMethod}>
                <SelectTrigger className="h-9 w-full text-xs rounded-2xl">
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Payment Channels</SelectItem>
                  <SelectItem value="CASH">Cash Over-the-Counter</SelectItem>
                  <SelectItem value="GCASH">GCash Digital</SelectItem>
                  <SelectItem value="MAYA">Maya Digital</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live calculated summary box */}
            <div className="rounded-3xl border border-border bg-muted/40 p-4 text-xs flex flex-col gap-1.5">
              <span className="font-semibold text-foreground">Calculated Export Summary:</span>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Period:</span>
                <span className="font-medium text-foreground">{dateFilterLabel(exportDateFilter)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Records count:</span>
                <span className="font-mono font-medium text-foreground">{exportItems.length} transactions</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Gross revenue:</span>
                <span className="font-mono font-bold text-primary">{formatPeso(exportSummary.totalGrossCollections)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExportModalOpen(false)}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={executeExport}
              disabled={exportItems.length === 0}
              className="rounded-2xl font-semibold"
            >
              <Download className="mr-1.5 size-4" />
              Download CSV Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
