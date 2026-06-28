import "server-only";

import { prisma } from "@/lib/prisma";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import type {
  AnnouncementDTO,
  DocumentRequestDTO,
  DocumentTypeDTO,
  RequestSummary,
} from "@/lib/documents";

/**
 * Server-side read models for the secretary console. Everything returned is
 * plain, serializable data (no Prisma `Decimal`, no `Date` objects): fees become
 * numbers and timestamps become ISO strings at the boundary, so values cross
 * into client components without surprises. Shared types live in
 * `@/lib/documents` (client-safe). Mirrors `@/lib/treasurer-data`.
 */

export async function getDocumentRequests(
  status?: DocumentRequestStatus,
): Promise<DocumentRequestDTO[]> {
  const rows = await prisma.documentRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      requester: { select: { email: true } },
      reviewedBy: { select: { name: true, firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    referenceNumber: row.referenceNumber,
    documentName: row.documentName,
    fee: Number(row.fee),
    purpose: row.purpose,
    method: row.method,
    paymentReference: row.paymentReference,
    proofImage: row.proofImage,
    status: row.status,
    note: row.note,
    requesterName: row.requesterName,
    requesterEmail: row.requester?.email ?? null,
    reviewedByName: personName(row.reviewedBy),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getDocumentRequestById(
  id: string,
): Promise<DocumentRequestDTO | null> {
  const row = await prisma.documentRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { email: true } },
      reviewedBy: { select: { name: true, firstName: true, lastName: true } },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    documentName: row.documentName,
    fee: Number(row.fee),
    purpose: row.purpose,
    method: row.method,
    paymentReference: row.paymentReference,
    proofImage: row.proofImage,
    status: row.status,
    note: row.note,
    requesterName: row.requesterName,
    requesterEmail: row.requester?.email ?? null,
    reviewedByName: personName(row.reviewedBy),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getRequestSummary(): Promise<RequestSummary> {
  const counts = await prisma.documentRequest.groupBy({
    by: ["status"],
    _count: true,
  });
  const by = new Map(counts.map((c) => [c.status, c._count]));
  return {
    pendingCount: by.get(DocumentRequestStatus.PENDING) ?? 0,
    processingCount: by.get(DocumentRequestStatus.PROCESSING) ?? 0,
    readyCount: by.get(DocumentRequestStatus.READY) ?? 0,
  };
}

export async function getDocumentTypes(): Promise<DocumentTypeDTO[]> {
  const rows = await prisma.documentType.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: { _count: { select: { requests: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    fee: Number(row.fee),
    turnaroundDays: row.turnaroundDays,
    active: row.active,
    requestCount: row._count.requests,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  }));
}

export async function getAnnouncements(): Promise<AnnouncementDTO[]> {
  const rows = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, firstName: true, lastName: true } },
    },
  });

  return rows.map(toAnnouncementDTO);
}

export function toAnnouncementDTO(row: {
  id: string;
  title: string;
  body: string;
  category: AnnouncementDTO["category"];
  pinned: boolean;
  published: boolean;
  place: string | null;
  createdAt: Date;
  author: { name: string | null; firstName: string | null; lastName: string | null } | null;
}): AnnouncementDTO {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    pinned: row.pinned,
    published: row.published,
    place: row.place,
    authorName: personName(row.author),
    createdAt: row.createdAt.toISOString(),
  };
}

function personName(
  person: { name: string | null; firstName: string | null; lastName: string | null } | null,
): string | null {
  if (!person) return null;
  const full = [person.firstName, person.lastName].filter(Boolean).join(" ");
  return full || person.name || null;
}
