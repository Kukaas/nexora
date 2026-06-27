import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clock, FilePlus2, MapPin, Phone, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { AnnouncementsFeed } from "../_components/announcements-feed";
import { ComingSoonButton } from "../_components/coming-soon-button";
import { QuickActions } from "../_components/quick-actions";
import { StatusBadge } from "../_components/status-badge";
import { MY_REQUESTS, formatFullDate, formatShortDate } from "../_data";

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
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="size-4" aria-hidden />
            Verified resident
          </span>
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8 lg:space-y-10">
          <QuickActions />
          <AnnouncementsFeed />
        </div>

        <aside className="space-y-6">
          <section id="my-requests" className="scroll-mt-20">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  My requests
                  <ComingSoonButton
                    feature="Request history"
                    variant="ghost"
                    size="sm"
                    className="-mr-1.5 text-muted-foreground"
                  >
                    View all
                  </ComingSoonButton>
                </CardTitle>
                <CardDescription>
                  Documents you&apos;ve requested and where they stand.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="-my-1 divide-y divide-border">
                  {MY_REQUESTS.map((req) => (
                    <li
                      key={req.id}
                      className="flex items-start justify-between gap-3 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {req.document}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {req.reference}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={req.status} />
                        <span className="text-[0.6875rem] text-muted-foreground tabular-nums">
                          Updated {formatShortDate(req.updatedAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <ComingSoonButton
                  feature="Document requests"
                  className="w-full"
                  size="lg"
                >
                  <FilePlus2 />
                  Request a document
                </ComingSoonButton>
              </CardFooter>
            </Card>
          </section>

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
