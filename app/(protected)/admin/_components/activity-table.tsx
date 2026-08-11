"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  FileText,
  IdCard,
  Loader,
  Megaphone,
  PackageCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
  XCircle,
  type LucideIcon,
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
  DataPagination,
  DEFAULT_PAGE_SIZE_OPTIONS,
  useClientPagination,
} from "@/components/ui/data-table";
import type { ActivityFeedEvent, ActivityKind } from "../_activity";
import { formatDateTime, formatRelative } from "../_data";

// Re-exported so the page keeps importing the event type from here.
export type { ActivityFeedEvent as ActivityEvent } from "../_activity";

type KindMeta = {
  icon: LucideIcon;
  /** Icon-chip tint, one per family of event (join / verify / request / notice). */
  tone: string;
  /** The muted phrase after the actor's name; `subject` is the doc/title, if any. */
  text: (subject: string | null) => string;
};

const NEUTRAL =
  "bg-muted text-muted-foreground ring-foreground/10 dark:ring-foreground/15";
const ACCENT = "bg-accent text-accent-foreground ring-accent-foreground/15";
const EMERALD =
  "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-400/20";
const BLUE =
  "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-400/20";
const AMBER =
  "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-400/20";
const VIOLET =
  "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-950/40 dark:text-violet-400 dark:ring-violet-400/20";
const DESTRUCTIVE =
  "bg-destructive/10 text-destructive ring-destructive/20 dark:bg-destructive/15";

const ACTIVITY_META: Record<ActivityKind, KindMeta> = {
  resident_joined: {
    icon: UserPlus,
    tone: NEUTRAL,
    text: () => " registered as a resident",
  },
  official_created: {
    icon: ShieldCheck,
    tone: ACCENT,
    text: () => " was added as an official",
  },
  id_submitted: {
    icon: IdCard,
    tone: BLUE,
    text: () => " submitted an ID for verification",
  },
  id_approved: {
    icon: BadgeCheck,
    tone: EMERALD,
    text: () => "’s ID was approved",
  },
  id_rejected: {
    icon: ShieldAlert,
    tone: DESTRUCTIVE,
    text: () => "’s ID was rejected",
  },
  request_submitted: {
    icon: FileText,
    tone: NEUTRAL,
    text: (s) => ` requested ${s ?? "a document"}`,
  },
  request_processing: {
    icon: Loader,
    tone: AMBER,
    text: (s) => `’s request for ${s ?? "a document"} is being processed`,
  },
  request_ready: {
    icon: PackageCheck,
    tone: EMERALD,
    text: (s) => `’s ${s ?? "document"} is ready to claim`,
  },
  request_claimed: {
    icon: BadgeCheck,
    tone: EMERALD,
    text: (s) => ` claimed ${s ?? "a document"}`,
  },
  request_rejected: {
    icon: XCircle,
    tone: DESTRUCTIVE,
    text: (s) => `’s request for ${s ?? "a document"} was rejected`,
  },
  announcement_posted: {
    icon: Megaphone,
    tone: VIOLET,
    text: (s) => ` posted an announcement${s ? `: ${s}` : ""}`,
  },
};

function ActivityRow({ event }: { event: ActivityFeedEvent }) {
  const meta = ACTIVITY_META[event.kind];
  const Icon = meta.icon;
  return (
    <li className="flex items-start gap-4 p-4 hover:bg-muted/40 transition-colors">
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset shadow-2xs",
          meta.tone,
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm leading-snug">
          <span className="font-semibold text-foreground">{event.actorName}</span>
          <span className="text-muted-foreground">{meta.text(event.subject)}</span>
        </p>
        {event.reference ? (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground border border-border/60">
            {event.reference}
          </span>
        ) : null}
      </div>
      <time
        dateTime={new Date(event.at).toISOString()}
        title={formatDateTime(new Date(event.at))}
        className="mt-0.5 shrink-0 text-xs text-muted-foreground tabular-nums font-mono"
      >
        {formatRelative(new Date(event.at))}
      </time>
    </li>
  );
}

export function ActivityTable({ events }: { events: ActivityFeedEvent[] }) {
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const summary = useMemo(() => {
    return {
      total: events.length,
      verifications: events.filter(
        (e) => e.kind === "id_submitted" || e.kind === "id_approved" || e.kind === "id_rejected"
      ).length,
      requests: events.filter((e) => e.kind.startsWith("request_")).length,
      registrations: events.filter(
        (e) => e.kind === "resident_joined" || e.kind === "official_created"
      ).length,
      announcements: events.filter((e) => e.kind === "announcement_posted").length,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (categoryFilter !== "ALL") {
        if (categoryFilter === "VERIFICATION") {
          if (e.kind !== "id_submitted" && e.kind !== "id_approved" && e.kind !== "id_rejected")
            return false;
        } else if (categoryFilter === "REQUESTS") {
          if (!e.kind.startsWith("request_")) return false;
        } else if (categoryFilter === "REGISTRATIONS") {
          if (e.kind !== "resident_joined" && e.kind !== "official_created") return false;
        } else if (categoryFilter === "ANNOUNCEMENTS") {
          if (e.kind !== "announcement_posted") return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchActor = e.actorName.toLowerCase().includes(q);
        const matchSubject = (e.subject ?? "").toLowerCase().includes(q);
        const matchRef = (e.reference ?? "").toLowerCase().includes(q);
        if (!matchActor && !matchSubject && !matchRef) return false;
      }

      return true;
    });
  }, [events, categoryFilter, searchQuery]);

  const pg = useClientPagination(filteredEvents, 20);

  const FILTERS = [
    { value: "ALL", label: "All Activity", count: events.length },
    { value: "VERIFICATION", label: "ID Verification", count: summary.verifications },
    { value: "REQUESTS", label: "Document Requests", count: summary.requests },
    { value: "REGISTRATIONS", label: "Registrations", count: summary.registrations },
    { value: "ANNOUNCEMENTS", label: "Announcements", count: summary.announcements },
  ];

  return (
    <div className="space-y-6">
      {/* Official Nexora KPI Stat Bar Suite */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total audit events" value={summary.total} />
        <Stat label="ID verifications" value={summary.verifications} accent />
        <Stat label="Document requests" value={summary.requests} />
        <Stat label="Registrations & joins" value={summary.registrations} />
      </dl>

      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <div
            role="tablist"
            aria-label="Filter activity log by category"
            className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
          >
            {FILTERS.map((f) => {
              const active = categoryFilter === f.value;
              return (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setCategoryFilter(f.value);
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
                placeholder="Search name, document, or ref #..."
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

      {filteredEvents.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Activity />
            </EmptyMedia>
            <EmptyTitle>No activity events match</EmptyTitle>
            <EmptyDescription>
              {events.length === 0
                ? "Events will appear here live as actions occur in the portal."
                : "Try clearing your search query or choosing a different activity category filter."}
            </EmptyDescription>
          </EmptyHeader>
          {events.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter("ALL");
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
          <ol className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            {pg.visible.map((e) => (
              <ActivityRow key={e.id} event={e} />
            ))}
          </ol>

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
