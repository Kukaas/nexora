import "server-only";

import { prisma } from "@/lib/prisma";
import {
  IDStatus,
  UserRoles,
  type DocumentRequestStatus,
  type PaymentMethodType,
} from "@/app/generated/prisma/enums";

/**
 * Server-side read models for the captain's oversight screens. The captain
 * doesn't act on records — they watch the whole barangay — so everything here
 * is aggregate counts. Request and payment reads are shared with the secretary
 * (`@/lib/secretary-data`) and treasurer (`@/lib/treasurer-data`) so the
 * captain always sees the same numbers those consoles work from.
 */

export type CommunitySummary = {
  /** Everyone holding the RESIDENT role, verified or not. */
  residentCount: number;
  newResidentsThisMonth: number;
  /** Government IDs still waiting for an admin's verification. */
  pendingIdCount: number;
  publishedAnnouncementCount: number;
};

export async function getCommunitySummary(): Promise<CommunitySummary> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    residentCount,
    newResidentsThisMonth,
    pendingIdCount,
    publishedAnnouncementCount,
  ] = await Promise.all([
    prisma.user.count({ where: { roles: { has: UserRoles.RESIDENT } } }),
    prisma.user.count({
      where: {
        roles: { has: UserRoles.RESIDENT },
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.iD.count({ where: { status: IDStatus.PENDING } }),
    prisma.announcement.count({ where: { published: true } }),
  ]);

  return {
    residentCount,
    newResidentsThisMonth,
    pendingIdCount,
    publishedAnnouncementCount,
  };
}

// ── Analytics ────────────────────────────────────────────────────────────────
//
// The captain's dashboard filters, charts, and exports on the client, so the
// server hands over one slim, serializable row per request (no field values,
// no notes) plus resident join dates. A barangay's volume is small enough that
// shipping the rows beats round-tripping every filter change.

export type AnalyticsRequestRow = {
  id: string;
  referenceNumber: string;
  documentName: string;
  requesterName: string;
  method: PaymentMethodType;
  /** The resident's payment reference (GCash/Maya transaction no.), if any. */
  paymentReference: string | null;
  fee: number;
  status: DocumentRequestStatus;
  createdAt: string;
  /** When the treasurer verified (or rejected) the payment. */
  reviewedAt: string | null;
  reviewedByName: string | null;
};

export type AnalyticsData = {
  requests: AnalyticsRequestRow[];
  /** ISO `createdAt` of every account holding the RESIDENT role. */
  residentJoinDates: string[];
  /** When this snapshot was read (ms) — the dashboard's stable "now". */
  generatedAt: number;
};

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [requests, residents] = await Promise.all([
    prisma.documentRequest.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        referenceNumber: true,
        documentName: true,
        requesterName: true,
        method: true,
        paymentReference: true,
        fee: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        reviewedBy: {
          select: { name: true, firstName: true, lastName: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { roles: { has: UserRoles.RESIDENT } },
      select: { createdAt: true },
    }),
  ]);

  return {
    requests: requests.map((row) => ({
      id: row.id,
      referenceNumber: row.referenceNumber,
      documentName: row.documentName,
      requesterName: row.requesterName,
      method: row.method,
      paymentReference: row.paymentReference,
      fee: Number(row.fee),
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      reviewedByName: reviewerName(row.reviewedBy),
    })),
    residentJoinDates: residents.map((r) => r.createdAt.toISOString()),
    generatedAt: Date.now(),
  };
}

function reviewerName(
  reviewer: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null,
): string | null {
  if (!reviewer) return null;
  const full = [reviewer.firstName, reviewer.lastName]
    .filter(Boolean)
    .join(" ");
  return full || reviewer.name || null;
}
