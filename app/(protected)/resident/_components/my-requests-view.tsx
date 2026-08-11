"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FilePlus2, LayoutGrid, Lock, Plus, Rows3, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { DocumentRequestDTO } from "@/lib/documents";
import { formatShortDate, residentStatus } from "../_data";
import { StatusBadge } from "./status-badge";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

type ViewMode = "card" | "table";

export function MyRequestsView({
  requests,
  basePath,
  requestHref,
  verified = true,
}: {
  requests: DocumentRequestDTO[];
  /** Detail route prefix; each request links to `${basePath}/{id}`. */
  basePath: string;
  /** Where the "Request a document" actions point. */
  requestHref: string;
  verified?: boolean;
}) {
  const [view, setView] = useState<ViewMode>("card");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // KPI Metrics Summary
  const summary = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length;
    const ready = requests.filter((r) => r.status === "READY").length;
    const completed = requests.filter((r) => r.status === "CLAIMED").length;
    return { total, pending, ready, completed };
  }, [requests]);

  // Filtered dataset
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDoc = req.documentName.toLowerCase().includes(q);
        const matchRef = req.referenceNumber.toLowerCase().includes(q);
        if (!matchDoc && !matchRef) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const pg = useClientPagination(filteredRequests, 10);

  const FILTERS = [
    { value: "ALL", label: "All", count: requests.length },
    { value: "PENDING", label: "Pending", count: requests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length },
    { value: "READY", label: "Ready for pickup", count: requests.filter((r) => r.status === "READY").length },
    { value: "CLAIMED", label: "Claimed", count: requests.filter((r) => r.status === "CLAIMED").length },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Official Nexora KPI Stat Bar */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total requests" value={summary.total} />
        <Stat label="Pending processing" value={summary.pending} accent />
        <Stat label="Ready for pickup" value={summary.ready} />
        <Stat label="Completed" value={summary.completed} />
      </dl>

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <div
            role="tablist"
            aria-label="Filter document requests by status"
            className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
          >
            {FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatusFilter(f.value);
                    pg.setPage(1);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-border/70 text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="text"
                placeholder="Search document or ref #..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pg.setPage(1);
                }}
                className="pl-9 pr-8 h-9 text-xs rounded-2xl bg-background border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    pg.setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilePlus2 />
            </EmptyMedia>
            <EmptyTitle>No requests yet</EmptyTitle>
            <EmptyDescription>
              When you request a barangay clearance, permit, or certificate, it shows up here so you can track where it stands.
            </EmptyDescription>
          </EmptyHeader>
          {verified ? (
            <Button asChild>
              <Link href={requestHref}>
                <Plus />
                Request Document
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline" className="opacity-60 cursor-not-allowed">
              <Lock />
              Verification Required
            </Button>
          )}
        </Empty>
      ) : filteredRequests.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FilePlus2 />
            </EmptyMedia>
            <EmptyTitle>No requests match your filter</EmptyTitle>
            <EmptyDescription>
              Try selecting a different status tab or clearing your search query.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => { setStatusFilter("ALL"); setSearchQuery(""); }}>
            Reset Filters
          </Button>
        </Empty>
      ) : (
        <>
          {view === "card" ? (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pg.visible.map((req) => (
                <li key={req.id}>
                  <Link
                    href={`${basePath}/${req.id}`}
                    className="group flex h-full flex-col gap-3 rounded-4xl border border-border bg-card p-4 shadow-sm ring-1 ring-foreground/5 outline-none transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 sm:p-5 dark:ring-foreground/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{req.documentName}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {req.referenceNumber}
                        </p>
                      </div>
                      <StatusBadge status={residentStatus(req.status)} />
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
                      <span className="font-mono font-medium tabular-nums">
                        {req.fee > 0 ? peso.format(req.fee) : "Free"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                        Updated {formatShortDate(req.reviewedAt ?? req.createdAt)}
                        <ChevronRight
                          className="size-4 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                      Document
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Reference
                    </TableHead>
                    <TableHead className="h-11 text-right text-xs font-medium tracking-wide text-muted-foreground">
                      Fee
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Updated
                    </TableHead>
                    <TableHead className="h-11 pe-5 text-xs font-medium tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.visible.map((req) => (
                    <TableRow key={req.id} className="group relative cursor-pointer">
                      <TableCell className="ps-5 font-medium">
                        <Link
                          href={`${basePath}/${req.id}`}
                          aria-label={`${req.documentName} · ${req.referenceNumber}`}
                          className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                        >
                          {req.documentName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {req.referenceNumber}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {req.fee > 0 ? peso.format(req.fee) : "Free"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {formatShortDate(req.reviewedAt ?? req.createdAt)}
                      </TableCell>
                      <TableCell className="pe-5">
                        <StatusBadge status={residentStatus(req.status)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}

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
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        {accent && <span className="size-2 rounded-full bg-primary" aria-hidden />}
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </dd>
    </div>
  );
}

/** Card / table segmented toggle. */
function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const options: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] =
    [
      { value: "card", label: "Cards", icon: LayoutGrid },
      { value: "table", label: "Table", icon: Rows3 },
    ];
  return (
    <div
      role="group"
      aria-label="Change layout"
      className="flex gap-1 rounded-2xl bg-muted p-1"
    >
      {options.map((opt) => {
        const active = view === opt.value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

