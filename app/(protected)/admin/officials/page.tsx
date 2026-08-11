import type { Metadata } from "next";
import { UserPlus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { CreateOfficialDialog } from "../_components/create-official-dialog";
import {
  OfficialsTable,
  type OfficialRow,
} from "../_components/officials-table";
import { UserRoles } from "@/app/generated/prisma/enums";
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

  const summary = {
    total: rows.length,
    executive: rows.filter((r) =>
      r.roles.some((role) =>
        ([UserRoles.CAPTAIN, UserRoles.SECRETARY, UserRoles.TREASURER] as UserRoles[]).includes(role)
      )
    ).length,
    kagawad: rows.filter((r) => r.roles.includes(UserRoles.KAGAWAD)).length,
    active: rows.filter((r) => r.emailVerified).length,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Barangay Officials Registry
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Manage official accounts, assigned governance roles (Captain, Secretary, Treasurer, Kagawad), and Purok jurisdiction.
          </p>
        </div>
        <CreateOfficialDialog className="shrink-0 rounded-2xl">
          <UserPlus />
          Create official account
        </CreateOfficialDialog>
      </header>

      {/* Official Nexora KPI Stat Bar */}
      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Total officials" value={summary.total} />
        <Stat label="Executive board" value={summary.executive} accent />
        <Stat label="Kagawads & council" value={summary.kagawad} />
        <Stat label="Active accounts" value={summary.active} />
      </dl>

      <OfficialsTable officials={rows} />

      <p className="text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "account" : "accounts"} with official
        governance access, including administrators.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        {accent && <span className="size-2 rounded-full bg-primary" aria-hidden />}
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </dd>
    </div>
  );
}
