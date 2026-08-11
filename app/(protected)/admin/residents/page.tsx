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
      // The ID under review (most recent), for the status badge + review dialog.
      ids: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          type: true,
          number: true,
          frontImage: true,
          backImage: true,
          status: true,
        },
      },
    },
  });

  const rows: ResidentRow[] = residents.map((r) => {
    const submittedId = r.ids[0] ?? null;
    return {
      id: r.id,
      name: displayName(r),
      email: r.email,
      mobileNumber: r.mobileNumber,
      status: residentStatus({ ...r, idStatus: submittedId?.status ?? null }),
      // Serialize the Date for the client component.
      joined: r.createdAt.toISOString(),
      submittedId: submittedId
        ? {
            type: submittedId.type,
            number: submittedId.number,
            frontImage: submittedId.frontImage,
            backImage: submittedId.backImage,
          }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Resident Directory & Verification
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Manage registered community members, verify submitted government IDs, and monitor account activation statuses.
        </p>
      </header>

      <ResidentsTable residents={rows} />

      <p className="text-xs text-muted-foreground">
        {rows.length} {rows.length === 1 ? "resident" : "residents"} registered in the barangay portal directory.
      </p>
    </div>
  );
}
