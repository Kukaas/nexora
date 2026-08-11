"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Inbox,
  Plus,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  UserX,
  X,
} from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlotterRecordDTO, BlotterStatus, IncidentType } from "@/lib/blotter-data";

export interface BlotterListProps {
  records: BlotterRecordDTO[];
  basePath: string;
}

const INCIDENT_LABELS: Record<IncidentType, string> = {
  NEIGHBOR_DISPUTE: "Neighbor Dispute",
  NOISE_COMPLAINT: "Noise Complaint",
  PHYSICAL_INJURY: "Physical Injury",
  PROPERTY_DAMAGE: "Property Damage",
  THEFT: "Theft / Burglary",
  THREATS: "Verbal Threats",
  DOMESTIC: "Domestic Conflict",
  OTHER: "Other Incident",
};

function formatIncidentTypeLabel(type: IncidentType): string {
  if (INCIDENT_LABELS[type]) {
    return INCIDENT_LABELS[type];
  }
  return type.replace(/_/g, " ");
}

function StatusBadge({ status }: { status: BlotterStatus }) {
  switch (status) {
    case "FILED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Clock className="size-3" aria-hidden />
          Filed / Pending
        </span>
      );
    case "MEDIATION_SCHEDULED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          <Calendar className="size-3" aria-hidden />
          Lupon Hearing
        </span>
      );
    case "SETTLED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          <CheckCircle2 className="size-3" aria-hidden />
          Settled
        </span>
      );
    case "DISMISSED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          Dismissed
        </span>
      );
    case "ESCALATED_TO_PNP":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          <AlertTriangle className="size-3" aria-hidden />
          PNP Escalated
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {status}
        </span>
      );
  }
}

function formatDate(isoStr: string) {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(isoStr));
  } catch {
    return isoStr;
  }
}

export function BlotterList({ records, basePath }: BlotterListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  // Summary counts
  const summary = useMemo(() => {
    const total = records.length;
    const filed = records.filter((r) => r.status === "FILED").length;
    const mediation = records.filter((r) => r.status === "MEDIATION_SCHEDULED").length;
    const settled = records.filter((r) => r.status === "SETTLED").length;
    const escalated = records.filter((r) => r.status === "ESCALATED_TO_PNP").length;
    return { total, filed, mediation, settled, escalated };
  }, [records]);

  // Filter dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && r.incidentType !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCase = r.caseNumber.toLowerCase().includes(q);
        const matchComp = r.complainantName.toLowerCase().includes(q);
        const matchResp = r.respondentName.toLowerCase().includes(q);
        const matchLoc = r.incidentLocation.toLowerCase().includes(q);
        if (!matchCase && !matchComp && !matchResp && !matchLoc) return false;
      }
      return true;
    });
  }, [records, statusFilter, typeFilter, search]);

  const { page, pageSize, pageCount, total, from, to, visible, setPage, setPageSize } =
    useClientPagination(filteredRecords, 10);

  const FILTERS = [
    { value: "ALL", label: "All", count: records.length },
    { value: "FILED", label: "To prepare", count: records.filter((r) => r.status === "FILED").length },
    { value: "MEDIATION_SCHEDULED", label: "Lupon hearing", count: records.filter((r) => r.status === "MEDIATION_SCHEDULED").length },
    { value: "SETTLED", label: "Settled", count: records.filter((r) => r.status === "SETTLED").length },
    { value: "DISMISSED", label: "Dismissed", count: records.filter((r) => r.status === "DISMISSED").length },
    { value: "ESCALATED_TO_PNP", label: "PNP Escalated", count: records.filter((r) => r.status === "ESCALATED_TO_PNP").length },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header action bar */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Barangay Incident Blotter
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Official log of recorded neighborhood disputes, complaints, and Lupon Tagapamayapa conciliation hearings.
          </p>
        </div>
        <Button asChild>
          <Link href={`${basePath}/new`}>
            <Plus />
            File New Incident
          </Link>
        </Button>
      </header>

      {/* Official Nexora KPI Stat Bar */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total cases" value={summary.total} />
        <Stat label="To prepare / Filed" value={summary.filed} accent />
        <Stat label="Lupon hearing" value={summary.mediation} />
        <Stat label="Settled" value={summary.settled} />
      </dl>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            role="tablist"
            aria-label="Filter blotter records by status"
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
                    setPage(1);
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
            <div className="relative min-w-44 sm:w-60">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="text"
                placeholder="Search case #, complainant, respondent..."
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
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {Object.entries(INCIDENT_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {records.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No blotter cases yet</EmptyTitle>
            <EmptyDescription>
              Once incidents or complaints are recorded, every blotter case shows up here.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus />
              File New Incident
            </Link>
          </Button>
        </Empty>
      ) : filteredRecords.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>No matching blotter cases</EmptyTitle>
            <EmptyDescription>
              Nothing matched the selected filters. Try broadening your query or status selection.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => { setStatusFilter("ALL"); setTypeFilter("ALL"); setSearch(""); }}>
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
                    Case Number
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Complainant
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Respondent
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Incident Type & Date
                  </TableHead>
                  <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 w-10 pe-5" aria-label="Open" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id} className="group relative cursor-pointer">
                    <TableCell className="ps-5 font-medium">
                      <Link
                        href={`${basePath}/${r.id}`}
                        aria-label={`Blotter case ${r.caseNumber} for ${r.complainantName}`}
                        className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                      >
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {r.caseNumber}
                        </span>
                        {r.isConfidential && (
                          <span className="ml-2 inline-flex rounded-full bg-purple-500/10 px-1.5 py-0.2 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                            Confidential
                          </span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      <div className="flex flex-col">
                        <span>{r.complainantName}</span>
                        {r.complainantContact && (
                          <span className="text-xs text-muted-foreground font-normal">{r.complainantContact}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{r.respondentName}</span>
                        {r.respondentAddress && (
                          <span className="text-xs text-muted-foreground truncate max-w-48">{r.respondentAddress}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{formatIncidentTypeLabel(r.incidentType)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(r.incidentDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="pe-5 text-right">
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

          {/* Mobile Stacked List View */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {visible.map((r) => (
              <li key={r.id}>
                <Link
                  href={`${basePath}/${r.id}`}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {r.caseNumber}
                      </span>
                      <span className="truncate font-medium">
                        {formatIncidentTypeLabel(r.incidentType)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Complainant: <span className="text-foreground font-medium">{r.complainantName}</span> vs <span className="text-foreground font-medium">{r.respondentName}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(r.incidentDate)} • {r.incidentLocation}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={r.status} />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
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

