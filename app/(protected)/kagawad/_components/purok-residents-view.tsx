"use client";

import { useMemo, useState } from "react";
import {
  LayoutGrid,
  List,
  Mail,
  Phone,
  Search,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  UsersRound,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { PurokResidentRow } from "@/lib/kagawad-data";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "R";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ResidencyBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const meta = {
    approved: {
      label: "Verified Account",
      icon: ShieldCheck,
      className:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    },
    pending: {
      label: "Pending Review",
      icon: ShieldQuestion,
      className:
        "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    },
    rejected: {
      label: "Needs Resubmission",
      icon: ShieldAlert,
      className:
        "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    },
  }[status];

  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 rounded-full text-xs font-semibold py-0.5 px-2.5", meta.className)}
    >
      <Icon className="size-3.5" aria-hidden />
      {meta.label}
    </Badge>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "card" | "table";
  onChange: (v: "card" | "table") => void;
}) {
  return (
    <div className="inline-flex h-9 items-center rounded-2xl bg-muted p-1 border border-border/40 shrink-0">
      <button
        type="button"
        onClick={() => onChange("card")}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors",
          view === "card"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="size-3.5" />
        <span className="hidden sm:inline">Grid</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors",
          view === "table"
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Table view"
      >
        <List className="size-3.5" />
        <span className="hidden sm:inline">Table</span>
      </button>
    </div>
  );
}

export interface PurokResidentsViewProps {
  purokLabel: string;
  residents: PurokResidentRow[];
  basePath: string;
}

export function PurokResidentsView({
  purokLabel,
  residents,
}: PurokResidentsViewProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [view, setView] = useState<"card" | "table">("card");

  // Summary Counters
  const summary = useMemo(() => {
    return residents.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.residency === "approved") acc.approved += 1;
        if (r.residency === "pending") acc.pending += 1;
        if (r.residency === "rejected") acc.rejected += 1;
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0 }
    );
  }, [residents]);

  const statusTabCounts = useMemo(() => {
    return {
      ALL: summary.total,
      APPROVED: summary.approved,
      PENDING: summary.pending,
      REJECTED: summary.rejected,
    };
  }, [summary]);

  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      if (statusFilter === "APPROVED" && r.residency !== "approved") return false;
      if (statusFilter === "PENDING" && r.residency !== "pending") return false;
      if (statusFilter === "REJECTED" && r.residency !== "rejected") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchEmail = r.email.toLowerCase().includes(q);
        const matchPhone = r.mobileNumber?.toLowerCase().includes(q) ?? false;
        return matchName || matchEmail || matchPhone;
      }

      return true;
    });
  }, [residents, statusFilter, search]);

  const pg = useClientPagination(filteredResidents, 12);

  const statusTabItems = [
    { value: "ALL", label: "All Residents" },
    { value: "APPROVED", label: "Verified" },
    { value: "PENDING", label: "Pending Review" },
    { value: "REJECTED", label: "Needs Resubmission" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {purokLabel} Residents
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Comprehensive directory of registered community residents in {purokLabel}. Access contact channels and review account verification status.
        </p>
      </header>

      {/* KPI Stat Bar Suite */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">Total Purok Residents</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight font-mono text-primary tabular-nums">
              {summary.total}
            </span>
            <span className="text-xs text-muted-foreground">registered</span>
          </dd>
        </div>

        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">Verified Accounts</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {summary.approved}
            </span>
            <span className="text-xs text-muted-foreground">approved</span>
          </dd>
        </div>

        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">Pending Review</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-amber-600 dark:text-amber-400 tabular-nums">
              {summary.pending}
            </span>
            <span className="text-xs text-muted-foreground">in review</span>
          </dd>
        </div>

        <div className="flex-1 px-5 py-4">
          <dt className="text-xs font-medium tracking-wide text-muted-foreground">Needs Resubmission</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {summary.rejected}
            </span>
            <span className="text-xs text-muted-foreground">rejected</span>
          </dd>
        </div>
      </dl>

      {/* Integrated Filter Toolbar Row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center justify-between">
          {/* Status Tab Pills */}
          <div role="tablist" className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1">
            {statusTabItems.map((tab) => {
              const active = statusFilter === tab.value;
              const count = statusTabCounts[tab.value as keyof typeof statusTabCounts];

              return (
                <button
                  key={tab.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatusFilter(tab.value);
                    pg.setPage(1);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-xs font-medium whitespace-nowrap outline-none transition-colors",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] tabular-nums font-semibold",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-border/70 text-muted-foreground"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:w-64">
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
                placeholder="Search resident name, email, mobile..."
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

            {/* View Layout Toggle */}
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredResidents.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No residents found</EmptyTitle>
            <EmptyDescription>
              {search
                ? `No residents matching "${search}" were found in ${purokLabel}.`
                : `No registered residents fit the selected verification filter.`}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {view === "card" ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pg.visible.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col justify-between gap-4 rounded-4xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10 hover:border-border/80 transition-all"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 border border-border/60 shadow-xs">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {initialsOf(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground text-sm">
                            {r.name}
                          </h3>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <ResidencyBadge status={r.residency} />
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        Joined {formatDate(r.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Contact Channels Card Footer */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                    {r.mobileNumber ? (
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="flex-1 rounded-2xl text-xs h-8 font-medium gap-1.5"
                      >
                        <a href={`tel:${r.mobileNumber}`}>
                          <Phone className="size-3 text-primary" />
                          <span>{r.mobileNumber}</span>
                        </a>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-2xl text-xs h-8 opacity-50 cursor-not-allowed"
                      >
                        <Phone className="size-3" />
                        <span>No Phone</span>
                      </Button>
                    )}

                    <Button
                      asChild
                      variant="outline"
                      size="icon-sm"
                      className="rounded-2xl h-8 w-8 shrink-0"
                      title={`Send email to ${r.name}`}
                    >
                      <a href={`mailto:${r.email}`}>
                        <Mail className="size-3.5 text-muted-foreground" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop & Tablet Table View */
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                      Resident Name & Email
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Mobile Number
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      ID Verification Status
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Registration Date
                    </TableHead>
                    <TableHead className="h-11 pe-5 text-right text-xs font-medium tracking-wide text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pg.visible.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="ps-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {initialsOf(r.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground text-sm">
                              {r.name}
                            </p>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {r.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-mono text-muted-foreground tabular-nums">
                        {r.mobileNumber ? (
                          <a
                            href={`tel:${r.mobileNumber}`}
                            className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline transition-colors"
                          >
                            <Phone className="size-3 text-muted-foreground" />
                            {r.mobileNumber}
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell>
                        <ResidencyBadge status={r.residency} />
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatDate(r.createdAt)}
                      </TableCell>

                      <TableCell className="pe-5 text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="rounded-2xl h-8 text-xs font-medium"
                        >
                          <a href={`mailto:${r.email}`}>
                            <Mail className="mr-1 size-3.5" />
                            Email
                          </a>
                        </Button>
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
        </div>
      )}
    </div>
  );
}
