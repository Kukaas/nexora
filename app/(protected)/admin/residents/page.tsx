import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { UserRoles } from "@/app/generated/prisma/enums";
import { residentStatus } from "../_components/account-status-badge";
import {
  ResidentsTable,
  type ResidentRow,
} from "../_components/residents-table";
import { displayName } from "../_data";

export const metadata: Metadata = {
  title: "Residents · Admin · Barangay Libtangin",
};

export default async function ResidentsPage() {
  const residents = await prisma.user.findMany({
    where: { roles: { has: UserRoles.RESIDENT } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      mobileNumber: true,
      emailVerified: true,
      profileCompletedAt: true,
      createdAt: true,
    },
  });

  const rows: ResidentRow[] = residents.map((r) => ({
    id: r.id,
    name: displayName(r),
    email: r.email,
    mobileNumber: r.mobileNumber,
    status: residentStatus(r),
    // Serialize the Date for the client component.
    joined: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Residents
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Community members who registered for an account. They appear here once
          they sign up; their status follows them from email confirmation
          through finishing setup.
        </p>
      </header>

      <ResidentsTable residents={rows} />
    </div>
  );
}
