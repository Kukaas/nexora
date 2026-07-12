"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Megaphone, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type AnnouncementDTO,
} from "@/lib/documents";
import { AnnouncementCategory } from "@/app/generated/prisma/enums";
import { Skeleton } from "@/components/ui/skeleton";
import { loadAnnouncements } from "../[id]/announcements/_actions";
import { AnnouncementCard } from "./announcement-card";

type Filter = AnnouncementCategory | "all";

const FILTERS: Filter[] = ["all", ...CATEGORY_ORDER];

export function AnnouncementsBoard({
  initialItems,
  initialHasMore,
}: {
  initialItems: AnnouncementDTO[];
  initialHasMore: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [error, setError] = useState<string | null>(null);
  // Distinguishes replacing the list (filter → skeletons) from appending to it
  // (load more → button spinner), which need different loading affordances.
  const [pendingKind, setPendingKind] = useState<null | "filter" | "more">(null);
  const [, startTransition] = useTransition();

  const categoryOf = (f: Filter) => (f === "all" ? null : f);

  function changeFilter(next: Filter) {
    if (next === filter) return;
    setFilter(next);
    setError(null);
    setPendingKind("filter");
    startTransition(async () => {
      try {
        const res = await loadAnnouncements({
          skip: 0,
          category: categoryOf(next),
        });
        setItems(res.items);
        setHasMore(res.hasMore);
      } catch {
        setError("We couldn't load that. Check your connection and try again.");
      } finally {
        setPendingKind(null);
      }
    });
  }

  function loadMore() {
    setError(null);
    setPendingKind("more");
    startTransition(async () => {
      try {
        const res = await loadAnnouncements({
          skip: items.length,
          category: categoryOf(filter),
        });
        setItems((prev) => [...prev, ...res.items]);
        setHasMore(res.hasMore);
      } catch {
        setError("We couldn't load more. Please try again.");
      } finally {
        setPendingKind(null);
      }
    });
  }

  const filtering = pendingKind === "filter";
  const loadingMore = pendingKind === "more";
  const busy = pendingKind !== null;

  return (
    <section aria-labelledby="announcements-heading">
      {/* Category filter. Sticky under the app header so it stays reachable as
          the list grows and the resident scrolls. */}
      <div
        role="group"
        aria-label="Filter announcements by category"
        className="sticky top-16 z-10 -mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-border/70 bg-muted/30 px-4 py-3 backdrop-blur-md [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {FILTERS.map((value) => {
          const active = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={busy}
              onClick={() => changeFilter(value)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60",
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

      <h2 id="announcements-heading" className="sr-only">
        Announcements
      </h2>

      {filtering ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <>
          <ul
            className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2"
            aria-live="polite"
          >
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

          <div className="mt-8 flex flex-col items-center gap-3">
            {error && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            {hasMore ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={busy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground shadow-sm transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-70"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading…
                  </>
                ) : error ? (
                  <>
                    <RotateCw className="size-4" aria-hidden />
                    Try again
                  </>
                ) : (
                  "Load more announcements"
                )}
              </button>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="size-4 text-accent-foreground" aria-hidden />
                You&apos;re all caught up.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="rounded-4xl border border-dashed border-border bg-card/50 px-5 py-16 text-center">
      <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Megaphone className="size-5" aria-hidden />
      </span>
      <p className="text-sm text-muted-foreground text-pretty">
        {filter === "all"
          ? "No announcements right now. Check back soon."
          : `No ${CATEGORY_LABELS[filter].toLowerCase()} announcements right now.`}
      </p>
    </div>
  );
}

/** Skeletons that mirror the card layout while a new filter loads. */
function FeedSkeleton() {
  return (
    <ul
      className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2"
      aria-hidden
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10"
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
