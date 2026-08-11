"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { Search, UserPlus, X } from "lucide-react";
import { UserRoles, type Purok } from "@/app/generated/prisma/enums";
import { PUROK_LABELS } from "@/lib/purok";
import { AccountStatusBadge } from "./account-status-badge";
import { RoleBadge } from "./role-badge";
import { CreateOfficialDialog } from "./create-official-dialog";
import { formatDate, initialsOf } from "../_data";
import { cn } from "@/lib/utils";

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
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOfficials = useMemo(() => {
    return officials.filter((o) => {
      if (roleFilter !== "ALL" && !o.roles.includes(roleFilter as UserRoles)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = o.name.toLowerCase().includes(q);
        const matchEmail = o.email.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      return true;
    });
  }, [officials, roleFilter, searchQuery]);

  const pg = useClientPagination(filteredOfficials, 20);

  const FILTERS = [
    { value: "ALL", label: "All Officials", count: officials.length },
    { value: UserRoles.CAPTAIN, label: "Captain", count: officials.filter((o) => o.roles.includes(UserRoles.CAPTAIN)).length },
    { value: UserRoles.SECRETARY, label: "Secretary", count: officials.filter((o) => o.roles.includes(UserRoles.SECRETARY)).length },
    { value: UserRoles.TREASURER, label: "Treasurer", count: officials.filter((o) => o.roles.includes(UserRoles.TREASURER)).length },
    { value: UserRoles.KAGAWAD, label: "Kagawad", count: officials.filter((o) => o.roles.includes(UserRoles.KAGAWAD)).length },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Toolbar & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
          <div
            role="tablist"
            aria-label="Filter officials by role"
            className="flex flex-1 gap-1 overflow-x-auto rounded-3xl bg-muted p-1"
          >
            {FILTERS.map((f) => {
              const active = roleFilter === f.value;
              return (
                <button
                  key={f.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setRoleFilter(f.value);
                    pg.setPage(1);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-[1.25rem] px-3 py-2 text-sm font-medium whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/30",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs tabular-nums",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "bg-border/70 text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-44 sm:w-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  pg.setPage(1);
                }}
                className="pl-9 pr-8 h-9 text-xs rounded-2xl bg-background border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    pg.setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {filteredOfficials.length === 0 ? (
        <Empty className="rounded-4xl border border-dashed border-border bg-card/50">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserPlus />
            </EmptyMedia>
            <EmptyTitle>No official accounts match</EmptyTitle>
            <EmptyDescription>
              Try clearing your search query or choosing a different role filter.
            </EmptyDescription>
          </EmptyHeader>
          <Button variant="outline" onClick={() => { setRoleFilter("ALL"); setSearchQuery(""); }}>
            Reset Filters
          </Button>
        </Empty>
      ) : (
        <>
          {/* Desktop Table View */}
          <TableCard className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Official</TableHead>
                  <TableHead>Role & Purok Assignment</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="pr-5 text-right">
                    Created
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pg.visible.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border">
                          <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
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
                    <TableCell>
                      <AccountStatusBadge
                        status={o.emailVerified ? "active" : "unverified"}
                      />
                    </TableCell>
                    <TableCell className="pr-5 text-right text-sm text-muted-foreground tabular-nums">
                      {formatDate(o.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableCard>

          {/* Mobile Stacked View */}
          <ul className="divide-y divide-border overflow-hidden rounded-4xl border border-border bg-card md:hidden">
            {pg.visible.map((o) => (
              <li key={o.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">
                        {initialsOf(o.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground text-sm">
                        {o.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {o.email}
                      </p>
                    </div>
                  </div>
                  <AccountStatusBadge
                    status={o.emailVerified ? "active" : "unverified"}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {o.roles.map((r) => (
                    <RoleBadge key={r} role={r} />
                  ))}
                  {o.roles.includes(UserRoles.KAGAWAD) && o.purok && (
                    <span className="inline-flex h-6 items-center rounded-3xl border border-border px-2.5 text-xs font-medium text-muted-foreground">
                      {PUROK_LABELS[o.purok]}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

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
        </>
      )}
    </div>
  );
}

