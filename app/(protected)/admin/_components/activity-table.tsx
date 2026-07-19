"use client";

import {
  BadgeCheck,
  FileText,
  IdCard,
  Loader,
  Megaphone,
  PackageCheck,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
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
    <li className="flex items-start gap-3.5 px-3 py-3.5 sm:px-5">
      <span
        className={cn(
          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
          meta.tone,
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-medium text-foreground">{event.actorName}</span>
          <span className="text-muted-foreground">{meta.text(event.subject)}</span>
        </p>
        {event.reference ? (
          <span className="mt-1 inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {event.reference}
          </span>
        ) : null}
      </div>
      <time
        dateTime={event.at.toISOString()}
        title={formatDateTime(event.at)}
        className="mt-0.5 shrink-0 text-xs text-muted-foreground tabular-nums"
      >
        {formatRelative(event.at)}
      </time>
    </li>
  );
}

/**
 * The live activity feed. Events arrive already flattened and sorted from the
 * server (see `_activity.ts`); this just paginates and renders each row with an
 * icon and phrase for its kind. The page re-renders on realtime refreshes, so new
 * events appear at the top without a manual reload.
 */
export function ActivityTable({ events }: { events: ActivityFeedEvent[] }) {
  const pg = useClientPagination(events, 20);

  return (
    <div className="space-y-4">
      <ol className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card">
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
    </div>
  );
}
