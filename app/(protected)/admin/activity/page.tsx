import type { Metadata } from "next";
import { Activity } from "lucide-react";

import { getActivityFeed } from "../_activity";
import { ActivityTable } from "../_components/activity-table";

export const metadata: Metadata = {
  title: "Activity log · Admin · Barangay Libtangin",
};

/** How many of the most recent events to show. */
const LIMIT = 50;

export default async function ActivityPage() {
  const events = await getActivityFeed(LIMIT);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Activity log
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          The {LIMIT} most recent things to happen across the barangay, newest
          first — registrations, ID verifications, document requests, and
          announcements. Updates live as they come in.
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-4xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Activity className="size-6" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="font-medium text-foreground">No activity yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Events show up here as residents register, IDs are reviewed, and
                document requests come through.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ActivityTable events={events} />
      )}
    </div>
  );
}
