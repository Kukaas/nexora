import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  Clock,
  FilePlus2,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { getResidencyStatus, type ResidencyStatus } from "@/lib/profile";
import {
  getMyDocumentRequests,
  getPublishedAnnouncementsPage,
  getUserPurok,
} from "@/lib/documents-data";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AnnouncementsFeed } from "../_components/announcements-feed";
import { StatusBadge } from "../_components/status-badge";
import { formatFullDate, formatShortDate, residentStatus } from "../_data";

export const metadata: Metadata = {
  title: "Resident portal · Barangay Libtangin",
};

export default async function ResidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // The portal shows the signed-in resident's own data, so a mismatched id in
  // the URL is sent back to their own dashboard rather than someone else's.
  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const user = session.user as { firstName?: string | null; name?: string | null };
  const firstName =
    user.firstName?.trim() || user.name?.trim()?.split(" ")[0] || "kabayan";

  // Residents can only transact once an official has approved the ID they
  // submitted at setup. Until then we show a review notice instead of the
  // request tools, so a pending (or rejected) resident can't request anything.
  const residency = await getResidencyStatus(session.user.id);
  const verified = residency === "approved";

  // Verified residents get the live request tools and their own request list;
  // everyone sees the published announcements. Unverified residents skip the
  // request-only queries since they can't transact yet.
  // The feed shows barangay-wide notices plus the resident's own purok's.
  const purok = await getUserPurok(session.user.id);
  const [myRequests, announcements] = await Promise.all([
    verified ? getMyDocumentRequests(session.user.id) : Promise.resolve([]),
    // Just a preview on the dashboard; the full, paginated list is its own page.
    getPublishedAnnouncementsPage({ take: 4, forPurok: purok }),
  ]);

  return (
    <div className="space-y-6 lg:space-y-8">
      <header>
        <p className="text-sm font-medium text-accent-foreground">
          Magandang araw,
        </p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {firstName}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{formatFullDate(new Date())}</span>
          <span
            aria-hidden
            className="hidden h-1 w-1 rounded-full bg-border sm:inline-block"
          />
          <ResidencyBadge status={residency} />
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8 lg:space-y-10">
          {verified ? (
            <section id="request" className="scroll-mt-20">
              <Link
                href={`/resident/${id}/request`}
                className="group flex items-center gap-4 rounded-4xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 transition-colors outline-none hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 sm:p-6 dark:ring-foreground/10"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <FilePlus2 className="size-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold tracking-tight">
                    Request a document
                  </span>
                  <span className="block text-sm text-muted-foreground text-pretty">
                    Apply online and track it here. No need to line up at the
                    hall.
                  </span>
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            </section>
          ) : (
            <ReviewNotice status={residency} />
          )}
          <AnnouncementsFeed
            announcements={announcements.items}
            hasMore={announcements.hasMore}
            moreHref={`/resident/${id}/announcements`}
          />
        </div>

        <aside className="space-y-6">
          {verified && (
            <section id="my-requests" className="scroll-mt-20">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    My requests
                    {myRequests.length > 0 && (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="-mr-1.5 text-muted-foreground"
                      >
                        <Link href={`/resident/${id}/requests`}>View all</Link>
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Documents you&apos;ve requested and where they stand.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myRequests.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground text-pretty">
                      You haven&apos;t requested any documents yet. Pick one above
                      to get started.
                    </p>
                  ) : (
                    <ul className="-my-1 divide-y divide-border">
                      {myRequests.slice(0, 5).map((req) => (
                        <li
                          key={req.id}
                          className="flex items-start justify-between gap-3 py-3.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {req.documentName}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                              {req.referenceNumber}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <StatusBadge status={residentStatus(req.status)} />
                            <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
                              Updated{" "}
                              {formatShortDate(req.reviewedAt ?? req.createdAt)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/resident/${id}/request`}>
                      <FilePlus2 />
                      Request a document
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </section>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Barangay hall</CardTitle>
              <CardDescription>
                Need help with a request? Reach the office directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-sm">
              <a
                href="tel:+63423321234"
                className="flex items-center gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Phone className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium text-foreground">
                    (042) 332-1234
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Barangay hotline
                  </span>
                </span>
              </a>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Clock className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium text-foreground">
                    Monday to Friday
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    8:00 AM to 5:00 PM
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium text-foreground">
                    Barangay Libtangin Hall
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Gasan, Marinduque
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/** The residency-verification chip shown next to the date in the greeting. */
function ResidencyBadge({ status }: { status: ResidencyStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="size-4" aria-hidden />
        Verified resident
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
        <ShieldAlert className="size-4" aria-hidden />
        Verification needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-accent-foreground">
      <ShieldQuestion className="size-4" aria-hidden />
      Verification pending
    </span>
  );
}

/**
 * Shown in place of the request tools while a resident isn't verified. They
 * can't request documents until an official approves the ID they submitted.
 */
function ReviewNotice({ status }: { status: ResidencyStatus }) {
  const rejected = status === "rejected";
  return (
    <section aria-labelledby="review-heading">
      <Card>
        <CardHeader>
          <span
            className={
              rejected
                ? "flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
                : "flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground"
            }
          >
            {rejected ? (
              <ShieldAlert className="size-5.5" aria-hidden />
            ) : (
              <Clock className="size-5.5" aria-hidden />
            )}
          </span>
          <CardTitle id="review-heading" className="mt-3 text-xl">
            {rejected
              ? "We couldn't verify your ID"
              : "Your account is under review"}
          </CardTitle>
          <CardDescription className="text-pretty">
            {rejected ? (
              <>
                The ID you submitted couldn&apos;t be verified. Please visit the
                Barangay Libtangin hall or call the hotline below so we can sort
                it out and you can resubmit.
              </>
            ) : (
              <>
                An official is verifying the ID you submitted. You&apos;ll be able
                to request documents and use the rest of the portal as soon as
                it&apos;s approved — no need to do anything else for now.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            {[
              { label: "Account created", done: true },
              { label: "ID submitted", done: true },
              {
                label: rejected ? "Verification rejected" : "Official review",
                done: false,
                current: true,
                bad: rejected,
              },
              { label: "Request documents", done: false },
            ].map((step) => (
              <li key={step.label} className="flex items-center gap-3">
                <span
                  className={
                    step.done
                      ? "flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : step.bad
                        ? "flex size-6 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                        : step.current
                          ? "flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground"
                          : "flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  }
                >
                  {step.done ? (
                    <ShieldCheck className="size-3.5" aria-hidden />
                  ) : step.bad ? (
                    <ShieldAlert className="size-3.5" aria-hidden />
                  ) : (
                    <Clock className="size-3.5" aria-hidden />
                  )}
                </span>
                <span
                  className={
                    step.done || step.current
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
        {rejected && (
          <CardFooter>
            <Button asChild>
              <Link href="/resident/resubmit">
                <RefreshCw />
                Resubmit ID
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
