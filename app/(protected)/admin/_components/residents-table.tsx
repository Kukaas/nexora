"use client";

import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";

import { Input } from "@/components/ui/input";
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
import {
  AccountStatusBadge,
  type AccountStatus,
} from "./account-status-badge";
import {
  ResidentReviewDialog,
  type SubmittedId,
} from "./resident-review-dialog";
import { formatDate, initialsOf } from "../_data";

export type ResidentRow = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  status: AccountStatus;
  joined: string;
  /** The ID they submitted at setup, or null if they haven't reached that step. */
  submittedId: SubmittedId | null;
};

export function ResidentsTable({ residents }: { residents: ResidentRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) =>
      [r.name, r.email, r.mobileNumber ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [query, residents]);

  const pg = useClientPagination(filtered, 10);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              pg.setPage(1);
            }}
            placeholder="Search name, email, or mobile"
            aria-label="Search residents"
            className="pl-9"
          />
        </div>
        <p
          aria-live="polite"
          className="text-sm text-muted-foreground tabular-nums"
        >
          {filtered.length} of {residents.length}{" "}
          {residents.length === 1 ? "resident" : "residents"}
        </p>
      </div>

      <TableCard>
        <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Resident</TableHead>
                <TableHead className="hidden md:table-cell">Mobile</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  Joined
                </TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pg.total === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="py-14">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <UsersRound className="size-5" aria-hidden />
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {residents.length === 0
                          ? "No residents yet"
                          : "No matches"}
                      </p>
                      <p className="max-w-xs text-sm text-muted-foreground">
                        {residents.length === 0
                          ? "Residents appear here once they register and verify their email."
                          : "Try a different name, email, or mobile number."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pg.visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {initialsOf(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {r.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-sm text-muted-foreground tabular-nums md:table-cell">
                      {r.mobileNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <AccountStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="hidden text-right text-sm text-muted-foreground tabular-nums sm:table-cell">
                      {formatDate(r.joined)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {r.submittedId && (
                        <ResidentReviewDialog
                          resident={{
                            id: r.id,
                            name: r.name,
                            email: r.email,
                            status: r.status,
                            submittedId: r.submittedId,
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </TableCard>

      {pg.total > 0 && (
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
      )}
    </div>
  );
}
