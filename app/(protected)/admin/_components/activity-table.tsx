"use client";

import { ShieldCheck, UserPlus } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataPagination,
  DEFAULT_PAGE_SIZE_OPTIONS,
  TableCard,
  useClientPagination,
} from "@/components/ui/data-table";
import { UserRoles } from "@/app/generated/prisma/enums";
import { AccountStatusBadge, type AccountStatus } from "./account-status-badge";
import { RoleBadge } from "./role-badge";
import { ROLE_META, formatDateTime, formatRelative, initialsOf } from "../_data";

/** One account event in the registry log, flattened for display. */
export type ActivityEvent = {
  id: string;
  name: string;
  email: string;
  role: UserRoles;
  isOfficial: boolean;
  status: AccountStatus;
  createdAt: Date;
};

export function ActivityTable({ events }: { events: ActivityEvent[] }) {
  const pg = useClientPagination(events, 20);

  return (
    <div className="space-y-4">
      {/* Table — tablet and up */}
      <TableCard className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 ps-5 text-xs font-medium tracking-wide text-muted-foreground">
                Account
              </TableHead>
              <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                Joined as
              </TableHead>
              <TableHead className="h-11 text-xs font-medium tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 pe-5 text-right text-xs font-medium tracking-wide text-muted-foreground">
                When
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.visible.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="ps-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {initialsOf(e.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {e.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {e.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    {e.isOfficial ? (
                      <ShieldCheck className="size-3.5" aria-hidden />
                    ) : (
                      <UserPlus className="size-3.5" aria-hidden />
                    )}
                    {ROLE_META[e.role].label}
                  </span>
                </TableCell>
                <TableCell>
                  {e.isOfficial ? (
                    <RoleBadge role={e.role} />
                  ) : (
                    <AccountStatusBadge status={e.status} />
                  )}
                </TableCell>
                <TableCell className="pe-5 text-right">
                  <time
                    dateTime={e.createdAt.toISOString()}
                    title={formatDateTime(e.createdAt)}
                    className="text-sm text-muted-foreground tabular-nums"
                  >
                    {formatRelative(e.createdAt)}
                  </time>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

      {/* Stacked rows — phones */}
      <ol className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
        {pg.visible.map((e) => (
          <li
            key={e.id}
            className="flex items-start gap-3.5 px-3 py-3.5 sm:px-4"
          >
            <Avatar className="mt-0.5 size-9">
              <AvatarFallback className="text-xs">
                {initialsOf(e.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate font-medium text-foreground">
                  {e.name}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  {e.isOfficial ? (
                    <ShieldCheck className="size-3.5" aria-hidden />
                  ) : (
                    <UserPlus className="size-3.5" aria-hidden />
                  )}
                  joined as {ROLE_META[e.role].label}
                </span>
              </div>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {e.email}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {e.isOfficial ? (
                <RoleBadge role={e.role} />
              ) : (
                <AccountStatusBadge status={e.status} />
              )}
              <time
                dateTime={e.createdAt.toISOString()}
                title={formatDateTime(e.createdAt)}
                className="text-xs text-muted-foreground tabular-nums"
              >
                {formatRelative(e.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>

      <DataPagination
        page={pg.page}
        pageCount={pg.pageCount}
        pageSize={pg.pageSize}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS}
        total={pg.total}
        from={pg.from}
        to={pg.to}
        onPageChange={pg.setPage}
        onPageSizeChange={pg.setPageSize}
      />
    </div>
  );
}
