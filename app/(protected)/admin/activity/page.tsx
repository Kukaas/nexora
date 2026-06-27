import type { Metadata } from "next";
import { Activity, ShieldCheck, UserPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { UserRoles } from "@/app/generated/prisma/enums";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AccountStatusBadge,
  residentStatus,
} from "../_components/account-status-badge";
import { RoleBadge } from "../_components/role-badge";
import {
  ROLE_META,
  displayName,
  formatDateTime,
  formatRelative,
  initialsOf,
  primaryRole,
} from "../_data";

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

      <div className="overflow-hidden rounded-4xl bg-card p-2 shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10 sm:p-3">
        {users.length === 0 ? (
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
        ) : (
          <ol className="divide-y divide-border">
            {users.map((u) => {
              const name = displayName(u);
              const role = primaryRole(u.roles);
              const isOfficial = role !== UserRoles.RESIDENT;
              const status = residentStatus(u);
              return (
                <li
                  key={u.id}
                  className="flex items-start gap-3.5 px-3 py-3.5 sm:px-4"
                >
                  <Avatar className="mt-0.5 size-9">
                    <AvatarFallback className="text-xs">
                      {initialsOf(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate font-medium text-foreground">
                        {name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {isOfficial ? (
                          <ShieldCheck className="size-3.5" aria-hidden />
                        ) : (
                          <UserPlus className="size-3.5" aria-hidden />
                        )}
                        joined as {ROLE_META[role].label}
                      </span>
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {isOfficial ? (
                      <RoleBadge role={role} />
                    ) : (
                      <AccountStatusBadge status={status} />
                    )}
                    <time
                      dateTime={u.createdAt.toISOString()}
                      title={formatDateTime(u.createdAt)}
                      className="text-xs text-muted-foreground tabular-nums"
                    >
                      {formatRelative(u.createdAt)}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
