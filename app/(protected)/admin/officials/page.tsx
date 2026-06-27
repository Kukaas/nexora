import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { UserRoles } from "@/app/generated/prisma/enums";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountStatusBadge } from "../_components/account-status-badge";
import { CreateOfficialDialog } from "../_components/create-official-dialog";
import { RoleBadge } from "../_components/role-badge";
import { OFFICIAL_ROLES, displayName, formatDate, initialsOf } from "../_data";

export const metadata: Metadata = {
  title: "Officials · Admin · Barangay Libtangin",
};

export default async function OfficialsPage() {
  const officials = await prisma.user.findMany({
    where: { roles: { hasSome: OFFICIAL_ROLES } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      roles: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Officials
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Accounts for the captain, council, and staff who run the barangay.
            Each one can sign in with the role you assign.
          </p>
        </div>
        <CreateOfficialDialog className="shrink-0">
          <UserPlus />
          Create official account
        </CreateOfficialDialog>
      </header>

      <div className="overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10">
        <div className="overflow-x-auto">
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
              {officials.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                        <UserPlus className="size-6" aria-hidden />
                      </span>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          No official accounts yet
                        </p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                          Create the first one for the captain or a staff member.
                        </p>
                      </div>
                      <CreateOfficialDialog>
                        <UserPlus />
                        Create official account
                      </CreateOfficialDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                officials.map((o) => {
                  const name = displayName(o);
                  const officialRoles = o.roles.filter((r) =>
                    OFFICIAL_ROLES.includes(r),
                  );
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs">
                              {initialsOf(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {name}
                            </p>
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {o.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {officialRoles.map((r) => (
                            <RoleBadge key={r} role={r} />
                          ))}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {officials.length}{" "}
        {officials.length === 1 ? "account" : "accounts"} with official access,
        including administrators.
      </p>
    </div>
  );
}
