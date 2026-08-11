"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Gavel,
  LayoutGrid,
  Lock,
  MapPin,
  Paperclip,
  Plus,
  Rows3,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  UserX,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlotterRecordDTO, BlotterStatus, IncidentType } from "@/lib/blotter-data";
import type { ResidencyStatus } from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ResidencyReviewNotice } from "./residency-review-notice";

const INCIDENT_TYPE_MAP: Record<IncidentType, { label: string; short: string }> = {
  NEIGHBOR_DISPUTE: { label: "Neighbor Dispute / Boundary Issues", short: "Neighbor Dispute" },
  NOISE_COMPLAINT: { label: "Excessive Noise Disturbance", short: "Noise Complaint" },
  PHYSICAL_INJURY: { label: "Physical Injury / Altercation", short: "Physical Injury" },
  PROPERTY_DAMAGE: { label: "Property Vandalism & Damage", short: "Property Damage" },
  THEFT: { label: "Theft / Loss of Property", short: "Theft / Burglary" },
  THREATS: { label: "Verbal Threats & Intimidation", short: "Verbal Threats" },
  DOMESTIC: { label: "Domestic & Family Conflict", short: "Domestic Conflict" },
  OTHER: { label: "Other Community Dispute", short: "Other Dispute" },
};

function formatIncidentTypeLabel(type: IncidentType): string {
  if (INCIDENT_TYPE_MAP[type]) {
    return INCIDENT_TYPE_MAP[type].short;
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
          <AlertCircle className="size-3" aria-hidden />
          Escalated PNP
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

type ViewMode = "card" | "table";

export function ResidentBlotterList({
  records,
  residentId,
  verified,
  residencyStatus = "pending",
}: {
  records: BlotterRecordDTO[];
  residentId: string;
  verified: boolean;
  residencyStatus?: ResidencyStatus;
}) {
  const [view, setView] = useState<ViewMode>("card");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Metrics summary
  const summary = useMemo(() => {
    const total = records.length;
    const filed = records.filter((r) => r.status === "FILED").length;
    const mediation = records.filter((r) => r.status === "MEDIATION_SCHEDULED").length;
    const settled = records.filter((r) => r.status === "SETTLED").length;
    return { total, filed, mediation, settled };
  }, [records]);

  // Filter dataset
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && r.incidentType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCase = r.caseNumber.toLowerCase().includes(q);
        const matchRespondent = r.respondentName.toLowerCase().includes(q);
        const matchLoc = r.incidentLocation.toLowerCase().includes(q);
        const matchNarrative = r.narrative.toLowerCase().includes(q);
        if (!matchCase && !matchRespondent && !matchLoc && !matchNarrative) return false;
      }
      return true;
    });
  }, [records, statusFilter, typeFilter, searchQuery]);

  const { page, pageSize, pageCount, total, from, to, visible, setPage, setPageSize } =
    useClientPagination(filteredRecords, 10);

  const FILTERS = [
    { value: "ALL", label: "All", count: records.length },
    { value: "FILED", label: "Pending review", count: records.filter((r) => r.status === "FILED").length },
    { value: "MEDIATION_SCHEDULED", label: "Lupon hearing", count: records.filter((r) => r.status === "MEDIATION_SCHEDULED").length },
    { value: "SETTLED", label: "Settled", count: records.filter((r) => r.status === "SETTLED").length },
    { value: "ESCALATED_TO_PNP", label: "PNP Escalated", count: records.filter((r) => r.status === "ESCALATED_TO_PNP").length },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Back to Portal Navigation */}
      <Link
        href={`/resident/${residentId}`}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to portal
      </Link>

      {/* Account Verification Requirement Banner */}
      {!verified && (
        <ResidencyReviewNotice
          status={residencyStatus}
          residentId={residentId}
          returnUrl={`/resident/${residentId}/blotter`}
          title="Blotter Case Filing Requires ID Verification"
        />
      )}

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            My Barangay Blotter Records
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Track official barangay blotter cases, Lupon Tagapamayapa hearing schedules, and formal conciliation results.
          </p>
        </div>
        {verified ? (
          <Button asChild>
            <Link href={`/resident/${residentId}/blotter/new`}>
              <Plus />
              File Blotter Report
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline" className="opacity-60 cursor-not-allowed">
            <Lock />
            Verification Required
          </Button>
        )}
      </header>

      {/* Official Nexora KPI Stat Bar */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total cases filed" value={summary.total} />
        <Stat label="Pending review" value={summary.filed} accent />
        <Stat label="Lupon hearing scheduled" value={summary.mediation} />
        <Stat label="Amicably settled" value={summary.settled} />
      </dl>

      {/* Filter Toolbar & View Mode Toggle */}
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
            <div className="relative min-w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="text"
                placeholder="Search case #, respondent..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-8 h-9 text-xs rounded-2xl bg-background border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
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
                {Object.entries(INCIDENT_TYPE_MAP).map(([k, cfg]) => (
                  <SelectItem key={k} value={k}>
                    {cfg.short}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {records.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Gavel />
            </EmptyMedia>
            <EmptyTitle>No blotter records found</EmptyTitle>
            <EmptyDescription>
              When you file an official barangay blotter complaint or dispute, it shows up here for conciliation tracking.
            </EmptyDescription>
          </EmptyHeader>
          {verified ? (
            <Button asChild>
              <Link href={`/resident/${residentId}/blotter/new`}>
                <Plus />
                File Blotter Report
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline" className="opacity-60 cursor-not-allowed">
              <Lock />
              Verification Required
            </Button>
          )}
        </Empty>
      ) : filteredRecords.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Gavel />
            </EmptyMedia>
            <EmptyTitle>No records match your filter</EmptyTitle>
            <EmptyDescription>
              Try selecting a different status tab or clearing your search query.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => { setStatusFilter("ALL"); setTypeFilter("ALL"); setSearchQuery(""); }}>
            Reset Filters
          </Button>
        </Empty>
      ) : (
        <>
          {view === "card" ? (
            /* Cards View */
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visible.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/resident/${residentId}/blotter/${r.id}`}
                    className="group flex h-full flex-col gap-3 rounded-4xl border border-border bg-card p-5.5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md cursor-pointer ring-1 ring-foreground/5 dark:ring-foreground/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {r.caseNumber}
                          </span>
                          {r.isConfidential && (
                            <span className="rounded-full bg-purple-500/10 px-2 py-0.2 text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                              Confidential
                            </span>
                          )}
                        </div>
                        <h3 className="truncate font-semibold text-foreground text-base mt-0.5 group-hover:text-primary transition-colors">
                          {formatIncidentTypeLabel(r.incidentType)}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          Complainant: <span className="text-foreground font-medium">{r.complainantName}</span> vs <span className="text-foreground font-medium">{r.respondentName}</span>
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed bg-muted/20 p-3.5 rounded-2xl border border-border/50">
                      {r.narrative}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
                      <span>{formatDate(r.incidentDate)}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                        View Details
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            /* Desktop Table View */
            <TableCard>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                      Case Number
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Complainant vs Respondent
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Type & Location
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Incident Date
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-11 text-right pe-5 text-xs font-medium tracking-wide text-muted-foreground" aria-label="Action" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((r) => (
                    <TableRow
                      key={r.id}
                      className="group border-b border-border transition-colors hover:bg-muted/40 cursor-pointer"
                    >
                      <TableCell className="ps-5 py-4">
                        <Link href={`/resident/${residentId}/blotter/${r.id}`} className="block">
                          <span className="font-mono text-xs font-semibold text-primary block">
                            {r.caseNumber}
                          </span>
                          {r.isConfidential && (
                            <span className="text-[10px] text-purple-600 font-semibold">Confidential</span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4">
                        <Link href={`/resident/${residentId}/blotter/${r.id}`} className="block">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                            {r.complainantName} <span className="text-muted-foreground font-normal">vs</span> {r.respondentName}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground">
                        <Link href={`/resident/${residentId}/blotter/${r.id}`} className="block truncate">
                          <span className="text-foreground font-medium block truncate">{formatIncidentTypeLabel(r.incidentType)}</span>
                          <span className="text-muted-foreground block truncate">{r.incidentLocation}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground">
                        <Link href={`/resident/${residentId}/blotter/${r.id}`} className="block">
                          {formatDate(r.incidentDate)}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4">
                        <Link href={`/resident/${residentId}/blotter/${r.id}`} className="block">
                          <StatusBadge status={r.status} />
                        </Link>
                      </TableCell>
                      <TableCell className="text-right pe-5 py-4">
                        <Link
                          href={`/resident/${residentId}/blotter/${r.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors"
                        >
                          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          )}

          {/* Mobile Stacked View */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {visible.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/resident/${residentId}/blotter/${r.id}`}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-muted/60 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-primary">
                        {r.caseNumber}
                      </span>
                      <span className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                        {formatIncidentTypeLabel(r.incidentType)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground truncate">
                      Respondent: <strong className="font-medium text-foreground">{r.respondentName}</strong>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {r.incidentLocation} • {formatDate(r.incidentDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <StatusBadge status={r.status} />
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary shrink-0" />
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

/** Card / table view switcher toggle. */
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

