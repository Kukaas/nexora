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
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          System Activity & Audit Log
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Realtime audit stream tracking resident registrations, ID verification reviews, document requests, and published community announcements across Barangay Libtangin.
        </p>
      </header>

      <ActivityTable events={events} />

      <p className="text-xs text-muted-foreground">
        Showing up to {LIMIT} recent real-time system events.
      </p>
    </div>
  );
}
