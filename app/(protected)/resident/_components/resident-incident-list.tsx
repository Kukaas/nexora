"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  LayoutGrid,
  Lock,
  MapPin,
  Paperclip,
  Plus,
  Rows3,
  Search,
  Shield,
  ShieldAlert,
  Siren,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IncidentReportDTO, IncidentStatus } from "@/lib/incidents-data";
import type { ResidencyStatus } from "@/lib/profile";
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
import { ResidencyReviewNotice } from "./residency-review-notice";

const CATEGORY_MAP: Record<string, { label: string; short: string }> = {
  NOISE_DISTURBANCE: { label: "Excessive Noise Disturbance", short: "Noise Disturbance" },
  PUBLIC_SAFETY: { label: "Public Safety & Hazard", short: "Public Safety" },
  SANITATION_ENVIRONMENT: { label: "Sanitation & Environment", short: "Sanitation" },
  STRAY_ANIMALS: { label: "Stray Animals & Pet Disturbance", short: "Stray Animals" },
  NEIGHBORHOOD_DISPUTE: { label: "Minor Neighborhood Dispute", short: "Neighborhood Dispute" },
  OTHER: { label: "General Community Incident", short: "General Incident" },
};

function getCategoryLabel(category: string): string {
  if (CATEGORY_MAP[category]) {
    return CATEGORY_MAP[category].short;
  }
  return category.replace(/_/g, " ");
}

function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  switch (status) {
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Clock className="size-3" aria-hidden />
          Submitted
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          <Shield className="size-3" aria-hidden />
          Under Review
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
          <Activity className="size-3 animate-pulse" aria-hidden />
          In Progress
        </span>
      );
    case "RESOLVED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          <CheckCircle2 className="size-3" aria-hidden />
          Resolved
        </span>
      );
    case "CONVERTED_TO_BLOTTER":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
          <ShieldAlert className="size-3" aria-hidden />
          Elevated Blotter
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

type ViewMode = "card" | "table";

export function ResidentIncidentList({
  residentId,
  incidents,
  verified = true,
  residencyStatus = "pending",
}: {
  residentId: string;
  incidents: IncidentReportDTO[];
  verified?: boolean;
  residencyStatus?: ResidencyStatus;
}) {
  const [view, setView] = useState<ViewMode>("card");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Metrics summary
  const summary = useMemo(() => {
    const total = incidents.length;
    const submitted = incidents.filter((i) => i.status === "SUBMITTED").length;
    const active = incidents.filter((i) => i.status === "UNDER_REVIEW" || i.status === "IN_PROGRESS").length;
    const resolved = incidents.filter((i) => i.status === "RESOLVED" || i.status === "CONVERTED_TO_BLOTTER").length;
    return { total, submitted, active, resolved };
  }, [incidents]);

  // Filter dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== "ALL" && inc.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && inc.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchNum = inc.reportNumber.toLowerCase().includes(q);
        const matchLoc = inc.location.toLowerCase().includes(q);
        const matchDesc = inc.description.toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchLoc && !matchDesc) return false;
      }
      return true;
    });
  }, [incidents, statusFilter, categoryFilter, searchQuery]);

  const { page, pageSize, pageCount, total, from, to, visible, setPage, setPageSize } =
    useClientPagination(filteredIncidents, 10);

  const FILTERS = [
    { value: "ALL", label: "All", count: incidents.length },
    { value: "SUBMITTED", label: "Pending review", count: incidents.filter((i) => i.status === "SUBMITTED").length },
    { value: "UNDER_REVIEW", label: "Under review", count: incidents.filter((i) => i.status === "UNDER_REVIEW").length },
    { value: "IN_PROGRESS", label: "In progress", count: incidents.filter((i) => i.status === "IN_PROGRESS").length },
    { value: "RESOLVED", label: "Resolved", count: incidents.filter((i) => i.status === "RESOLVED").length },
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
          returnUrl={`/resident/${residentId}/incidents`}
          title="Account ID Verification Required"
        />
      )}

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            My Incident Reports
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Report public safety concerns, environmental hazards, noise complaints, and track official responses.
          </p>
        </div>
        {verified ? (
          <Button asChild>
            <Link href={`/resident/${residentId}/incidents/new`}>
              <Plus />
              Report Incident
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
        <Stat label="Total reports" value={summary.total} />
        <Stat label="Pending review" value={summary.submitted} accent />
        <Stat label="Under action" value={summary.active} />
        <Stat label="Resolved" value={summary.resolved} />
      </dl>

      {/* Filter Toolbar & View Mode Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            role="tablist"
            aria-label="Filter incident reports by status"
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
                placeholder="Search title, report #..."
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
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[150px] text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.entries(CATEGORY_MAP).map(([k, cfg]) => (
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
      {incidents.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Siren />
            </EmptyMedia>
            <EmptyTitle>No incident reports yet</EmptyTitle>
            <EmptyDescription>
              When you report a public safety concern, noise complaint, or hazard, it shows up here for you to track.
            </EmptyDescription>
          </EmptyHeader>
          {verified ? (
            <Button asChild>
              <Link href={`/resident/${residentId}/incidents/new`}>
                <Plus />
                Report Incident
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline" className="opacity-60 cursor-not-allowed">
              <Lock />
              Verification Required
            </Button>
          )}
        </Empty>
      ) : filteredIncidents.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Siren />
            </EmptyMedia>
            <EmptyTitle>No reports match your filter</EmptyTitle>
            <EmptyDescription>
              Try selecting a different status tab or clearing your search query.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => { setStatusFilter("ALL"); setCategoryFilter("ALL"); setSearchQuery(""); }}>
            Reset Filters
          </Button>
        </Empty>
      ) : (
        <>
          {view === "card" ? (
            /* Cards View */
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visible.map((inc) => (
                <li key={inc.id}>
                  <Link
                    href={`/resident/${residentId}/incidents/${inc.id}`}
                    className="group flex h-full flex-col gap-3 rounded-4xl border border-border bg-card p-5.5 shadow-xs transition-all hover:border-primary/50 hover:shadow-md cursor-pointer ring-1 ring-foreground/5 dark:ring-foreground/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {inc.reportNumber}
                        </span>
                        <h3 className="truncate font-semibold text-foreground text-base mt-0.5 group-hover:text-primary transition-colors">
                          {inc.title}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {getCategoryLabel(inc.category)} • {inc.location}
                        </p>
                      </div>
                      <IncidentStatusBadge status={inc.status} />
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed bg-muted/20 p-3.5 rounded-2xl border border-border/50">
                      {inc.description}
                    </p>

                    {inc.attachmentUrl && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Paperclip className="size-3.5" />
                        <span>Attached Photo / Proof Evidence</span>
                      </div>
                    )}

                    {inc.adminNotes && (
                      <div className="rounded-2xl bg-sky-500/10 p-3 text-xs text-sky-800 dark:text-sky-200 space-y-0.5">
                        <span className="font-semibold">Barangay Official Response:</span>
                        <p className="line-clamp-2">{inc.adminNotes}</p>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-border pt-3.5 text-xs text-muted-foreground">
                      <span>{formatDate(inc.incidentDate)}</span>
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
                      Report #
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Title & Category
                    </TableHead>
                    <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                      Location
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
                  {visible.map((inc) => (
                    <TableRow
                      key={inc.id}
                      className="group border-b border-border transition-colors hover:bg-muted/40 cursor-pointer"
                    >
                      <TableCell className="ps-5 py-4 font-mono text-xs font-semibold text-primary">
                        <Link href={`/resident/${residentId}/incidents/${inc.id}`} className="block">
                          {inc.reportNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4">
                        <Link href={`/resident/${residentId}/incidents/${inc.id}`} className="block">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors block truncate">{inc.title}</span>
                          <span className="text-xs text-muted-foreground block truncate">{getCategoryLabel(inc.category)}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground">
                        <Link href={`/resident/${residentId}/incidents/${inc.id}`} className="block truncate">
                          {inc.location}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground">
                        <Link href={`/resident/${residentId}/incidents/${inc.id}`} className="block">
                          {formatDate(inc.incidentDate)}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4">
                        <Link href={`/resident/${residentId}/incidents/${inc.id}`} className="block">
                          <IncidentStatusBadge status={inc.status} />
                        </Link>
                      </TableCell>
                      <TableCell className="text-right pe-5 py-4">
                        <Link
                          href={`/resident/${residentId}/incidents/${inc.id}`}
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

