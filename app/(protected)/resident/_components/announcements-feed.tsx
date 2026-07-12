import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";

import { BARANGAY, type AnnouncementDTO } from "@/lib/documents";
import { AnnouncementCard } from "./announcement-card";

/**
 * The announcements preview on the resident dashboard: the latest few notices
 * with a link to the dedicated, paginated announcements page. The dashboard
 * only fetches this short slice, so the overview stays light on slow phones;
 * the full history (with category filters and "Load more") lives on its own
 * page.
 */
export function AnnouncementsFeed({
  announcements,
  moreHref,
  hasMore,
}: {
  announcements: AnnouncementDTO[];
  moreHref: string;
  hasMore: boolean;
}) {
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

        {announcements.length > 0 && (
          <Link
            href={moreHref}
            className="group inline-flex items-center gap-1 rounded-full text-sm font-medium text-accent-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            View all
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-border bg-card/50 px-5 py-14 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Megaphone className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground text-pretty">
            No announcements right now. Check back soon.
          </p>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {announcements.map((item, i) => (
              <li
                key={item.id}
                className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500"
                style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}
              >
                <AnnouncementCard item={item} />
              </li>
            ))}
          </ul>

          {hasMore && (
            <Link
              href={moreHref}
              className="group mt-4 flex h-12 items-center justify-center gap-1.5 rounded-full border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              View all announcements
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          )}
        </>
      )}
    </section>
  );
}
