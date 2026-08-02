import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Megaphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublishedAnnouncementsPage } from "@/lib/documents-data";
import { CATEGORY_LABELS } from "@/lib/documents";
import { APP_TIME_ZONE, BARANGAY } from "@/lib/site";
import { PageHeading, PageShell } from "@/app/_components/page-shell";
import { JsonLd, breadcrumbLd, graph } from "@/app/_components/json-ld";

export const metadata: Metadata = {
  title: "Announcements · Barangay Libtangin",
  description:
    "Advisories, health bulletins, assembly notices, and event schedules posted by the Barangay Libtangin office in Gasan, Marinduque.",
  alternates: { canonical: "/announcements" },
};

// A notice posted this morning has to be public this morning, so this page is
// always rendered fresh rather than prerendered at build time.
export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: APP_TIME_ZONE,
  });
}

/** "9:00 AM – 12:00 NN" from the stored 24-hour strings; "" when no time is set. */
function formatTimeRange(start: string | null, end: string | null): string {
  const to12h = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const suffix = h < 12 ? "AM" : "PM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
  };
  if (!start) return "";
  const from = to12h(start);
  const until = end ? to12h(end) : "";
  return until ? `${from} – ${until}` : from;
}

export default async function AnnouncementsPage() {
  // Barangay-wide notices only: purok-scoped ones are addressed to specific
  // residents and have no business on a page anyone can read.
  const { items } = await getPublishedAnnouncementsPage({
    forPurok: null,
    audience: "barangay",
    take: 30,
  });

  return (
    <PageShell>
      <JsonLd
        data={graph(
          breadcrumbLd([{ name: "Announcements", path: "/announcements" }]),
        )}
      />

      <PageHeading
        eyebrow={
          <>
            <Megaphone className="size-4 text-primary" aria-hidden />
            From the Barangay Hall
          </>
        }
        title="Announcements from Barangay Libtangin"
        lead={`Advisories, health bulletins, assembly notices, and event schedules posted by the ${BARANGAY.name} office. Create an account to also receive the notices meant for your own purok.`}
      >
        <Button asChild size="lg" className="h-12 px-6 text-base">
          <Link href="/sign-up">
            Create your account
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </PageHeading>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-4xl px-5 sm:px-8">
          {items.length > 0 ? (
            <ul className="flex flex-col gap-6">
              {items.map((item) => {
                const timeRange = formatTimeRange(item.startTime, item.endTime);
                return (
                  <li
                    key={item.id}
                    className="rounded-4xl border border-border bg-card p-6 shadow-sm sm:p-8"
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[item.category]}
                      </Badge>
                      {item.pinned ? <Badge>Pinned</Badge> : null}
                      <span className="text-sm text-muted-foreground">
                        Posted {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-balance text-xl font-semibold tracking-tight sm:text-2xl">
                      {item.title}
                    </h2>

                    <p className="mt-3 whitespace-pre-line text-pretty leading-relaxed text-muted-foreground">
                      {item.body}
                    </p>

                    {(item.date || item.place || timeRange) && (
                      <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
                        {item.date ? (
                          <div className="inline-flex items-center gap-2">
                            <CalendarDays
                              className="size-4 text-primary"
                              aria-hidden
                            />
                            <dt className="sr-only">Date</dt>
                            <dd className="font-medium">
                              {formatDate(item.date)}
                            </dd>
                          </div>
                        ) : null}
                        {timeRange ? (
                          <div className="inline-flex items-center gap-2">
                            <Clock className="size-4 text-primary" aria-hidden />
                            <dt className="sr-only">Time</dt>
                            <dd className="font-medium">{timeRange}</dd>
                          </div>
                        ) : null}
                        {item.place ? (
                          <div className="inline-flex items-center gap-2">
                            <MapPin className="size-4 text-primary" aria-hidden />
                            <dt className="sr-only">Place</dt>
                            <dd className="font-medium">{item.place}</dd>
                          </div>
                        ) : null}
                      </dl>
                    )}

                    {item.authorName ? (
                      <p className="mt-4 text-sm text-muted-foreground">
                        Posted by {item.authorName}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-5 rounded-4xl border border-dashed border-border bg-secondary/60 px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary ring-1 ring-primary/15">
                <Megaphone className="size-6" aria-hidden />
              </span>
              <div className="max-w-md">
                <p className="text-lg font-semibold tracking-tight">
                  No announcements yet
                </p>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  When {BARANGAY.name} posts an update, it will appear here.
                  Create an account to get advisories the moment they are
                  published, including the ones meant for your purok.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create your account
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          )}

          <p className="mt-10 text-pretty text-sm leading-relaxed text-muted-foreground">
            Notices addressed to a single purok are shown only to the residents
            of that purok, inside their account. Sign in to see yours, or{" "}
            <Link
              href="/services"
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
            >
              browse the documents you can request
            </Link>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
