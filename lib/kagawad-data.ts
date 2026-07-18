import "server-only";

import { prisma } from "@/lib/prisma";
import { toAnnouncementDTO } from "@/lib/secretary-data";
import type { AnnouncementDTO } from "@/lib/documents";
import {
  IDStatus,
  UserRoles,
  type Purok,
} from "@/app/generated/prisma/enums";

/**
 * Server-side read models for the kagawad console. A kagawad's whole view is
 * scoped to the purok the admin assigned them: their announcements, the
 * residents they serve, and the overview counts all filter on it.
 */

/** The purok assigned to a kagawad, or null when the admin hasn't set one. */
export async function getAssignedPurok(userId: string): Promise<Purok | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { purok: true },
  });
  return user?.purok ?? null;
}

export type PurokResidentRow = {
  id: string;
  name: string;
  email: string;
  mobileNumber: string | null;
  /** Residency verification derived from the latest submitted ID. */
  residency: "pending" | "approved" | "rejected";
  createdAt: string;
};

/**
 * The residents living in one purok, for the kagawad's residents list. Reads
 * the latest ID per resident to derive the same residency status the admin
 * console shows, so both consoles agree on who is verified.
 */
export async function getPurokResidents(
  purok: Purok,
): Promise<PurokResidentRow[]> {
  const rows = await prisma.user.findMany({
    where: { purok, roles: { has: UserRoles.RESIDENT } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      mobileNumber: true,
      createdAt: true,
      ids: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  });

  return rows.map((row) => {
    const latest = row.ids[0];
    const residency =
      latest?.status === IDStatus.APPROVED
        ? ("approved" as const)
        : latest?.status === IDStatus.REJECTED
          ? ("rejected" as const)
          : ("pending" as const);
    return {
      id: row.id,
      name:
        [row.firstName, row.lastName].filter(Boolean).join(" ").trim() ||
        row.name?.trim() ||
        row.email,
      email: row.email,
      mobileNumber: row.mobileNumber,
      residency,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export type KagawadOverview = {
  residentCount: number;
  publishedCount: number;
  draftCount: number;
  /** The purok's most recent notices, newest first. */
  recent: AnnouncementDTO[];
};

/** The counts and recent notices the kagawad dashboard shows for one purok. */
export async function getKagawadOverview(
  purok: Purok,
): Promise<KagawadOverview> {
  const [residentCount, publishedCount, draftCount, recentRows] =
    await prisma.$transaction([
      prisma.user.count({
        where: { purok, roles: { has: UserRoles.RESIDENT } },
      }),
      prisma.announcement.count({ where: { purok, published: true } }),
      prisma.announcement.count({ where: { purok, published: false } }),
      prisma.announcement.findMany({
        where: { purok },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          author: { select: { name: true, firstName: true, lastName: true } },
        },
      }),
    ]);

  return {
    residentCount,
    publishedCount,
    draftCount,
    recent: recentRows.map(toAnnouncementDTO),
  };
}
