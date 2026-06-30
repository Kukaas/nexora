import type { Metadata } from "next";
import { Activity } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { UserRoles } from "@/app/generated/prisma/enums";
import { residentStatus } from "../_components/account-status-badge";
import {
  ActivityTable,
  type ActivityEvent,
} from "../_components/activity-table";
import { displayName, primaryRole } from "../_data";

export const metadata: Metadata = {
  title: "Activity log · Admin · Barangay Libtangin",
};

/** How many of the most recent account events to show. */
const LIMIT = 50;

export default async function ActivityPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      roles: true,
      emailVerified: true,
      profileCompletedAt: true,
      createdAt: true,
    },
  });

  // Flatten each account into a display row once, on the server.
  const events: ActivityEvent[] = users.map((u) => {
    const role = primaryRole(u.roles);
    return {
      id: u.id,
      name: displayName(u),
      email: u.email,
      role,
      isOfficial: role !== UserRoles.RESIDENT,
      status: residentStatus(u),
      createdAt: u.createdAt,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Activity log
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          The {LIMIT} most recent accounts to join the barangay registry, newest
          first — officials you created and residents who registered.
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
                Account events show up here as officials are created and
                residents register.
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
