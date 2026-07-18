"use client";

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
import { UserRoles, type Purok } from "@/app/generated/prisma/enums";
import { PUROK_LABELS } from "@/lib/purok";
import { AccountStatusBadge } from "./account-status-badge";
import { RoleBadge } from "./role-badge";
import { formatDate, initialsOf } from "../_data";

/** One official account, with roles already filtered to official ones. */
export type OfficialRow = {
  id: string;
  name: string;
  email: string;
  roles: UserRoles[];
  /** A kagawad's assigned purok; null for other roles. */
  purok: Purok | null;
  emailVerified: boolean;
  createdAt: Date;
};

export function OfficialsTable({ officials }: { officials: OfficialRow[] }) {
  const pg = useClientPagination(officials, 20);

  return (
    <div className="space-y-4">
      <TableCard>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Official</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden pr-5 text-right md:table-cell">
                Created
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.visible.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {initialsOf(o.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {o.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {o.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {o.roles.map((r) => (
                      <RoleBadge key={r} role={r} />
                    ))}
                    {o.roles.includes(UserRoles.KAGAWAD) && o.purok && (
                      <span className="inline-flex h-6 items-center rounded-3xl border border-border px-2.5 text-xs font-medium text-muted-foreground">
                        {PUROK_LABELS[o.purok]}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <AccountStatusBadge
                    status={o.emailVerified ? "active" : "unverified"}
                  />
                </TableCell>
                <TableCell className="hidden pr-5 text-right text-sm text-muted-foreground tabular-nums md:table-cell">
                  {formatDate(o.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>

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
