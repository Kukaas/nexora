import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { CreateOfficialDialog } from "../_components/create-official-dialog";
import {
  OfficialsTable,
  type OfficialRow,
} from "../_components/officials-table";
import { OFFICIAL_ROLES, displayName } from "../_data";

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
      purok: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const rows: OfficialRow[] = officials.map((o) => ({
    id: o.id,
    name: displayName(o),
    email: o.email,
    roles: o.roles.filter((r) => OFFICIAL_ROLES.includes(r)),
    purok: o.purok,
    emailVerified: o.emailVerified,
    createdAt: o.createdAt,
  }));

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

      {rows.length === 0 ? (
        <div className="rounded-4xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
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
        </div>
      ) : (
        <OfficialsTable officials={rows} />
      )}

      <p className="text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "account" : "accounts"} with official
        access, including administrators.
      </p>
    </div>
  );
}
