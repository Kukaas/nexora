"use client";

import { useMemo, useState } from "react";
import { IdCard, Search, UsersRound, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  AccountStatusBadge,
  type AccountStatus,
} from "./account-status-badge";
import {
  ResidentReviewDialog,
  type SubmittedId,
} from "./resident-review-dialog";
import { formatDate, initialsOf } from "../_data";
import { cn } from "@/lib/utils";

export type ResidentRow = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  status: AccountStatus;
  joined: string;
  /** The ID they submitted at setup, or null if they haven't reached that step. */
  submittedId: SubmittedId | null;
};

export function ResidentsTable({ residents }: { residents: ResidentRow[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const summary = useMemo(() => {
    return {
      total: residents.length,
      underReview: residents.filter((r) => r.status === "review").length,
      active: residents.filter((r) => r.status === "active").length,
      rejected: residents.filter((r) => r.status === "rejected").length,
      pending: residents.filter((r) => r.status === "pending" || r.status === "unverified").length,
    };
  }, [residents]);

  const filtered = useMemo(() => {
    return residents.filter((r) => {
      if (statusFilter !== "ALL") {
        if (statusFilter === "pending") {
          if (r.status !== "pending" && r.status !== "unverified") return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchEmail = r.email.toLowerCase().includes(q);
        const matchMobile = (r.mobileNumber ?? "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchMobile) return false;
      }
      return true;
    });
  }, [residents, statusFilter, searchQuery]);

  const pg = useClientPagination(filtered, 10);

  const FILTERS = [
    { value: "ALL", label: "All Residents", count: residents.length },
    { value: "review", label: "Awaiting Review", count: summary.underReview },
    { value: "active", label: "Verified Active", count: summary.active },
    { value: "rejected", label: "ID Rejected", count: summary.rejected },
    { value: "pending", label: "Pending Setup", count: summary.pending },
  ];

  return (
    <div className="space-y-6">
      {/* Official Nexora KPI Stat Bar Suite */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total registered" value={summary.total} />
        <Stat label="Awaiting ID review" value={summary.underReview} accent />
        <Stat label="Verified & active" value={summary.active} />
        <Stat label="Pending setup" value={summary.pending} />
      </dl>

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <div
            role="tablist"
            aria-label="Filter residents by account status"
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
            <div className="relative min-w-44 sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="text"
                placeholder="Search name, email, or mobile..."
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
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRound />
            </EmptyMedia>
            <EmptyTitle>No residents match your filter</EmptyTitle>
            <EmptyDescription>
              {residents.length === 0
                ? "Residents will appear here once community members sign up."
                : "Try clearing your search query or choosing a different status filter."}
            </EmptyDescription>
          </EmptyHeader>
          {residents.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("ALL");
                setSearchQuery("");
                pg.setPage(1);
              }}
            >
              Reset Filters
            </Button>
          )}
        </Empty>
      ) : (
        <>
          {/* Desktop Table View */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Resident</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border">
                          <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
                            {initialsOf(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {r.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                      {r.mobileNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <AccountStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                      {formatDate(r.joined)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {r.submittedId ? (
                        <ResidentReviewDialog
                          resident={{
                            id: r.id,
                            name: r.name,
                            email: r.email,
                            status: r.status,
                            submittedId: r.submittedId,
                          }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {/* Mobile Stacked List View */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {pg.visible.map((r) => (
              <li key={r.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
                        {initialsOf(r.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground text-sm">
                        {r.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {r.email}
                      </p>
                    </div>
                  </div>
                  <AccountStatusBadge status={r.status} className="shrink-0" />
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs text-muted-foreground">
                  <span className="font-mono">{r.mobileNumber ?? "No mobile"}</span>
                  <span className="tabular-nums">Joined {formatDate(r.joined)}</span>
                </div>
                {r.submittedId && (
                  <div className="pt-1 flex justify-end">
                    <ResidentReviewDialog
                      resident={{
                        id: r.id,
                        name: r.name,
                        email: r.email,
                        status: r.status,
                        submittedId: r.submittedId,
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
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
