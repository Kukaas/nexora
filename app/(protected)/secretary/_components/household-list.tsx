"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Heart,
  Home,
  Inbox,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CensusStatsDTO, HouseholdDTO } from "@/lib/household-data";

export interface HouseholdListProps {
  households: HouseholdDTO[];
  censusStats: CensusStatsDTO;
  basePath: string;
}

const PUROK_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PUROK_1", label: "Purok 1" },
  { value: "PUROK_2", label: "Purok 2" },
  { value: "PUROK_3", label: "Purok 3" },
  { value: "PUROK_4", label: "Purok 4" },
  { value: "PUROK_5", label: "Purok 5" },
  { value: "PUROK_6", label: "Purok 6" },
  { value: "PUROK_7", label: "Purok 7" },
];

export function HouseholdList({ households, censusStats, basePath }: HouseholdListProps) {
  const [search, setSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("ALL");
  const [welfareFilter, setWelfareFilter] = useState("ALL");

  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      if (purokFilter !== "ALL" && h.purok !== purokFilter) return false;

      if (welfareFilter !== "ALL") {
        if (welfareFilter === "4PS" && !h.is4Ps) return false;
        if (welfareFilter === "INDIGENT" && !h.isIndigent) return false;
        if (welfareFilter === "SENIOR" && !h.hasSenior) return false;
        if (welfareFilter === "PWD" && !h.hasPWD) return false;
        if (welfareFilter === "SOLO_PARENT" && !h.hasSoloParent) return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchNum = h.householdNumber.toLowerCase().includes(q);
        const matchAddr = h.streetAddress.toLowerCase().includes(q);
        const matchHead = h.headName ? h.headName.toLowerCase().includes(q) : false;
        if (!matchNum && !matchAddr && !matchHead) return false;
      }

      return true;
    });
  }, [households, purokFilter, welfareFilter, search]);

  const { page, pageSize, pageCount, total, from, to, visible, setPage, setPageSize } =
    useClientPagination(filteredHouseholds, 10);

  return (
    <div className="flex flex-col gap-8">
      {/* Header action bar */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Households & Census Registry
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Official demographic registry and welfare indicators (4Ps, Indigent, Senior Citizens, PWDs).
          </p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus />
            Register Household
          </Link>
        </Button>
      </header>

      {/* Official Nexora KPI Stat Bar */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total households" value={censusStats.totalHouseholds} />
        <Stat label="Total population" value={censusStats.totalPopulation} accent />
        <Stat label="4Ps beneficiaries" value={censusStats.total4PsHouseholds} />
        <Stat label="Indigent families" value={censusStats.totalIndigentHouseholds} />
        <Stat label="Seniors" value={censusStats.totalSeniors} />
        <Stat label="PWDs" value={censusStats.totalPWDs} />
      </dl>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            role="tablist"
            aria-label="Filter households by purok"
            className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
          >
            {PUROK_OPTIONS.map((p) => {
              const active = purokFilter === p.value;
              const count =
                p.value === "ALL"
                  ? households.length
                  : households.filter((h) => h.purok === p.value).length;

              return (
                <button
                  key={p.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setPurokFilter(p.value);
                    setPage(1);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p.label}
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
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

          <div className="flex items-center gap-2">
            <div className="relative min-w-44 sm:w-60">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="text"
                placeholder="Search household #, address, head..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 h-9 text-xs rounded-2xl bg-background border-border"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Select
              value={welfareFilter}
              onValueChange={(v) => {
                setWelfareFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[160px] text-xs">
                <SelectValue placeholder="All Welfare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Welfare</SelectItem>
                <SelectItem value="4PS">4Ps Beneficiaries</SelectItem>
                <SelectItem value="INDIGENT">Indigent Families</SelectItem>
                <SelectItem value="SENIOR">Senior Citizens</SelectItem>
                <SelectItem value="PWD">PWDs</SelectItem>
                <SelectItem value="SOLO_PARENT">Solo Parents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {households.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No registered households yet</EmptyTitle>
            <EmptyDescription>
              Once household census records are encoded, every household shows up here.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus />
              Register Household
            </Link>
          </Button>
        </Empty>
      ) : filteredHouseholds.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No matching households</EmptyTitle>
            <EmptyDescription>
              Nothing matched the selected filters. Try selecting a different purok or clearing your search.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => { setPurokFilter("ALL"); setWelfareFilter("ALL"); setSearch(""); }}>
            Reset Filters
          </Button>
        </Empty>
      ) : (
        <>
          {/* Desktop Table View */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                    Household #
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Location & Address
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Head of Household
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Members
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Welfare Badges
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5" aria-label="Open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((h) => {
                  const purokLabel = h.purok.replace("PUROK_", "Purok ");
                  return (
                    <TableRow key={h.id} className="group relative cursor-pointer">
                      <TableCell className="ps-5 font-medium">
                        <Link
                          href={`${basePath}/${h.id}`}
                          aria-label={`Household ${h.householdNumber} in ${purokLabel}`}
                          className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                        >
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {h.householdNumber}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        <div className="flex flex-col">
                          <span>{purokLabel}</span>
                          <span className="text-xs text-muted-foreground font-normal">{h.streetAddress}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="text-foreground font-medium">{h.headName || "No Head Assigned"}</span>
                          {h.headEmail && (
                            <span className="text-xs text-muted-foreground truncate max-w-48">{h.headEmail}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full font-mono text-xs">
                          {h.memberCount} {h.memberCount === 1 ? "member" : "members"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {h.is4Ps && (
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              4Ps
                            </span>
                          )}
                          {h.isIndigent && (
                            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                              Indigent
                            </span>
                          )}
                          {h.hasSenior && (
                            <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-400">
                              Senior
                            </span>
                          )}
                          {h.hasPWD && (
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                              PWD
                            </span>
                          )}
                          {h.hasSoloParent && (
                            <span className="inline-flex items-center rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-700 dark:text-pink-400">
                              Solo Parent
                            </span>
                          )}
                          {!h.is4Ps && !h.isIndigent && !h.hasSenior && !h.hasPWD && !h.hasSoloParent && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
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

          {/* Mobile Stacked List View */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {visible.map((h) => {
              const purokLabel = h.purok.replace("PUROK_", "Purok ");
              return (
                <li key={h.id}>
                  <Link
                    href={`${basePath}/${h.id}`}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {h.householdNumber}
                        </span>
                        <span className="truncate font-medium">
                          {purokLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Head: <span className="text-foreground font-medium">{h.headName || "No Head Assigned"}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {h.streetAddress} • {h.memberCount} members
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge variant="secondary" className="rounded-full text-[10px]">
                        {h.memberCount} M
                      </Badge>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>

          <DataPagination
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
            total={total}
            from={from}
            to={to}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
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

