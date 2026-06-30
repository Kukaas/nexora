import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import type {
  AnnouncementDTO,
  DocumentRequestDTO,
  DocumentTypeDTO,
  RequestPage,
  RequestQuery,
  RequestStatusCounts,
  RequestSummary,
} from "@/lib/documents";

/**
 * Server-side read models for the secretary console. Everything returned is
 * plain, serializable data (no Prisma `Decimal`, no `Date` objects): fees become
 * numbers and timestamps become ISO strings at the boundary, so values cross
 * into client components without surprises. Shared types live in
 * `@/lib/documents` (client-safe). Mirrors `@/lib/treasurer-data`.
 */

const requestInclude = {
  requester: { select: { email: true } },
  reviewedBy: { select: { name: true, firstName: true, lastName: true } },
} satisfies Prisma.DocumentRequestInclude;

type RequestRow = Prisma.DocumentRequestGetPayload<{
  include: typeof requestInclude;
}>;

function toRequestDTO(row: RequestRow): DocumentRequestDTO {
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

/** Build the shared where-clause for status + created-at range filters. */
function requestWhere(
  status: DocumentRequestStatus | "ALL",
  start: string | null,
  end: string | null,
): Prisma.DocumentRequestWhereInput {
  const where: Prisma.DocumentRequestWhereInput = {};
  if (status !== "ALL") where.status = status;
  if (start || end) {
    where.createdAt = {
      ...(start ? { gte: new Date(start) } : {}),
      ...(end ? { lte: new Date(end) } : {}),
    };
  }
  return where;
}

/**
 * One page of document requests for the secretary table. Only the requested
 * slice is read from the database; the client asks for the next page as the
 * secretary moves through them, so the full list is never loaded at once.
 */
export async function getDocumentRequestsPage({
  status,
  start,
  end,
  page,
  pageSize,
}: RequestQuery): Promise<RequestPage> {
  const where = requestWhere(status, start, end);
  const safePage = Math.max(1, Math.trunc(page));

  const [rows, total] = await prisma.$transaction([
    prisma.documentRequest.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: requestInclude,
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.documentRequest.count({ where }),
  ]);

  return {
    items: rows.map(toRequestDTO),
    total,
    page: safePage,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Per-status counts within a date range, for the table's filter tabs. */
export async function getRequestStatusCounts(
  start: string | null,
  end: string | null,
): Promise<RequestStatusCounts> {
  const grouped = await prisma.documentRequest.groupBy({
    by: ["status"],
    where: requestWhere("ALL", start, end),
    _count: true,
  });

  const counts: RequestStatusCounts = {
    all: 0,
    [DocumentRequestStatus.PENDING]: 0,
    [DocumentRequestStatus.PROCESSING]: 0,
    [DocumentRequestStatus.READY]: 0,
    [DocumentRequestStatus.REJECTED]: 0,
  };
  for (const group of grouped) {
    counts[group.status] = group._count;
    counts.all += group._count;
  }
  return counts;
}

/** The most recent requests in a status, for the overview's short queues. */
export async function getRecentRequestsByStatus(
  status: DocumentRequestStatus,
  take: number,
): Promise<DocumentRequestDTO[]> {
  const rows = await prisma.documentRequest.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: requestInclude,
    take,
  });
  return rows.map(toRequestDTO);
}

export async function getDocumentRequestById(
  id: string,
): Promise<DocumentRequestDTO | null> {
  const row = await prisma.documentRequest.findUnique({
    where: { id },
    include: requestInclude,
  });
  return row ? toRequestDTO(row) : null;
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
