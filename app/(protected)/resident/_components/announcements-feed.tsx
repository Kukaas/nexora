"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, MapPin, Megaphone, Pin } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type AnnouncementDTO,
} from "@/lib/documents";
import { AnnouncementCategory } from "@/app/generated/prisma/enums";
import { formatFullDate, formatShortDate } from "../_data";

type Filter = AnnouncementCategory | "all";

const FILTERS: Filter[] = ["all", ...CATEGORY_ORDER];

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
    <section id="announcements" aria-labelledby="announcements-heading" className="scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h2
            id="announcements-heading"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <Megaphone className="size-5 text-primary" aria-hidden />
            Announcements
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Notices and updates from the barangay hall.
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

      <div className="overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10">
        {items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            {announcements.length === 0
              ? "No announcements right now. Check back soon."
              : `No ${CATEGORY_LABELS[filter as AnnouncementCategory].toLowerCase()} announcements right now.`}
          </p>
        ) : (
          <ul key={filter} className="divide-y divide-border">
            {items.map((item, i) => (
              <li
                key={item.id}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-both motion-safe:duration-300"
                style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
              >
                <AnnouncementRow item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function AnnouncementRow({ item }: { item: AnnouncementDTO }) {
  const [open, setOpen] = useState(false);
  const detailId = `${item.id}-detail`;

  return (
    <div className="px-4 py-4 sm:px-5 sm:py-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-start gap-3 text-left outline-none"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {CATEGORY_LABELS[item.category]}
            </Badge>
            {item.pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground">
                <Pin className="size-3" aria-hidden />
                Pinned
              </span>
            )}
            <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
              {formatShortDate(item.createdAt)}
            </span>
          </div>

          <h3 className="font-medium text-foreground group-focus-visible:underline group-focus-visible:underline-offset-4">
            {item.title}
          </h3>

          {item.date && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent-foreground">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              {formatFullDate(item.date)}
            </p>
          )}

          <p
            className={cn(
              "mt-1 text-sm text-muted-foreground",
              !open && "line-clamp-2",
            )}
          >
            {item.body}
          </p>
        </div>

        <ChevronDown
          aria-hidden
          className={cn(
            "mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && item.place && (
        <div
          id={detailId}
          className="mt-3 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <MapPin className="size-4 text-accent-foreground" aria-hidden />
            {item.place}
          </p>
        </div>
      )}
    </div>
  );
}
