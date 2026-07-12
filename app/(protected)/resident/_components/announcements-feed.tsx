"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  ExternalLink,
  HandHeart,
  HeartPulse,
  Info,
  Landmark,
  MapPin,
  Megaphone,
  PartyPopper,
  Pin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  BARANGAY,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  directionsUrl,
  formatTimeRange,
  type AnnouncementDTO,
} from "@/lib/documents";
import { AnnouncementCategory } from "@/app/generated/prisma/enums";
import { LibtanginMapView } from "@/components/libtangin-map";
import { formatFullDate, formatShortDate } from "../_data";

type Filter = AnnouncementCategory | "all";

const FILTERS: Filter[] = ["all", ...CATEGORY_ORDER];

/** Icon per category, so a resident can recognize the kind of notice at a glance. */
const CATEGORY_ICONS: Record<AnnouncementCategory, LucideIcon> = {
  [AnnouncementCategory.ADVISORY]: Info,
  [AnnouncementCategory.HEALTH]: HeartPulse,
  [AnnouncementCategory.EVENTS]: PartyPopper,
  [AnnouncementCategory.ASSISTANCE]: HandHeart,
  [AnnouncementCategory.GOVERNANCE]: Landmark,
};

export function AnnouncementsFeed({
  announcements,
}: {
  announcements: AnnouncementDTO[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo(
    () =>
      filter === "all"
        ? announcements
        : announcements.filter((a) => a.category === filter),
    [announcements, filter],
  );

  return (
    <section
      id="announcements"
      aria-labelledby="announcements-heading"
      className="scroll-mt-20"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2
            id="announcements-heading"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <Megaphone className="size-5 text-primary" aria-hidden />
            Announcements
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
            Notices and events from {BARANGAY.name}, {BARANGAY.area}.
          </p>
        </div>
      </div>

      {announcements.length > 0 && (
        <div
          role="group"
          aria-label="Filter announcements by category"
          className="mb-4 flex flex-wrap gap-2"
        >
          {FILTERS.map((value) => {
            const active = filter === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(value)}
                className={cn(
                  "inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                  active
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {value === "all" ? "All" : CATEGORY_LABELS[value]}
              </button>
            );
          })}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-border bg-card/50 px-5 py-14 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Megaphone className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground text-pretty">
            {announcements.length === 0
              ? "No announcements right now. Check back soon."
              : `No ${CATEGORY_LABELS[
                  filter as AnnouncementCategory
                ].toLowerCase()} announcements right now.`}
          </p>
        </div>
      ) : (
        <ul key={filter} className="space-y-4">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500"
              style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
            >
              <AnnouncementCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AnnouncementCard({ item }: { item: AnnouncementDTO }) {
  const [open, setOpen] = useState(false);
  const detailId = `${item.id}-detail`;

  const CategoryIcon = CATEGORY_ICONS[item.category];
  const timeLabel = formatTimeRange(item.startTime, item.endTime);
  const whenParts = [
    item.date ? formatFullDate(item.date) : null,
    timeLabel,
  ].filter(Boolean);
  const hasWhen = whenParts.length > 0;
  const hasPoint = item.latitude != null && item.longitude != null;
  const hasWhere = Boolean(item.place) || hasPoint;
  const hasMeta = hasWhen || hasWhere;
  const isLong = item.body.length > 180;

  return (
    <article className="overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10">
      {item.imageUrl && (
        <div className="relative">
          {/* Cloudinary delivery URL; plain img avoids remotePatterns config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
          {item.pinned && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-accent-foreground shadow-sm backdrop-blur-sm">
              <Pin className="size-3" aria-hidden />
              Pinned
            </span>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-border px-2.5 text-xs font-medium text-muted-foreground">
            <CategoryIcon className="size-3.5" aria-hidden />
            {CATEGORY_LABELS[item.category]}
          </span>
          {item.pinned && !item.imageUrl && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground">
              <Pin className="size-3" aria-hidden />
              Pinned
            </span>
          )}
          <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
            {formatShortDate(item.createdAt)}
          </span>
        </div>

        <h3 className="mt-2.5 text-lg font-semibold leading-snug tracking-tight text-balance">
          {item.title}
        </h3>

        {hasMeta && (
          <dl className="mt-3 flex flex-col gap-2.5 rounded-2xl bg-muted/60 p-3.5 sm:p-4">
            {hasWhen && (
              <div className="flex items-start gap-2.5">
                <dt className="mt-0.5 shrink-0">
                  {item.date ? (
                    <CalendarDays
                      className="size-4 text-accent-foreground"
                      aria-label="When"
                    />
                  ) : (
                    <Clock
                      className="size-4 text-accent-foreground"
                      aria-label="When"
                    />
                  )}
                </dt>
                <dd className="text-sm font-medium text-foreground">
                  {whenParts.join(" · ")}
                </dd>
              </div>
            )}
            {hasWhere && (
              <div className="flex items-start gap-2.5">
                <dt className="mt-0.5 shrink-0">
                  <MapPin
                    className="size-4 text-accent-foreground"
                    aria-label="Where"
                  />
                </dt>
                <dd className="min-w-0 text-sm">
                  <span className="font-medium text-foreground">
                    {item.place ?? "Pinned location"}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {BARANGAY.name}, {BARANGAY.area}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        )}

        {hasPoint && (
          <div className="mt-3">
            <LibtanginMapView
              lat={item.latitude as number}
              lng={item.longitude as number}
              label={item.place ?? undefined}
            />
            <div className="mt-2 flex justify-end">
              <a
                href={directionsUrl(
                  item.latitude as number,
                  item.longitude as number,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-accent-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                Get directions
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          </div>
        )}

        <p
          id={detailId}
          className={cn(
            "mt-3 text-sm leading-relaxed text-muted-foreground text-pretty",
            !open && isLong && "line-clamp-3",
          )}
        >
          {item.body}
        </p>

        {isLong && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {open ? "Show less" : "Read more"}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        )}
      </div>
    </article>
  );
}
