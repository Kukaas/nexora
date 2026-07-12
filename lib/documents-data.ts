import "server-only";

import { prisma } from "@/lib/prisma";
import { toAnnouncementDTO } from "@/lib/secretary-data";
import {
  parseDocumentFields,
  parseDocumentFieldValues,
  type AnnouncementDTO,
  type DocumentRequestDTO,
  type DocumentTypeDTO,
} from "@/lib/documents";
import type { PaymentMethodDTO } from "@/lib/payments";
import {
  AnnouncementCategory,
  PaymentMethodType,
} from "@/app/generated/prisma/enums";
import { METHOD_ORDER } from "@/lib/payments";

/**
 * Resident-facing reads for the document-request flow and the announcements
 * feed. Kept separate from the secretary console reads so the resident bundle
 * never pulls in the full back-office query surface.
 */

/** The document types residents may request right now (active only). */
export async function getActiveDocumentTypes(): Promise<DocumentTypeDTO[]> {
  const rows = await prisma.documentType.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    fee: Number(row.fee),
    turnaroundDays: row.turnaroundDays,
    active: row.active,
    fields: parseDocumentFields(row.fields),
    template: row.template ?? null,
    paperSize: row.paperSize,
    orientation: row.orientation,
    requestCount: 0,
    updatedAt: null,
  }));
}

/** A single requestable document type, or null if it's missing or retired. */
export async function getActiveDocumentTypeById(
  id: string,
): Promise<DocumentTypeDTO | null> {
  const row = await prisma.documentType.findFirst({
    where: { id, active: true },
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    fee: Number(row.fee),
    turnaroundDays: row.turnaroundDays,
    active: row.active,
    fields: parseDocumentFields(row.fields),
    template: row.template ?? null,
    paperSize: row.paperSize,
    orientation: row.orientation,
    requestCount: 0,
    updatedAt: null,
  };
}

/** A document type by id regardless of active state, for the resident edit form. */
export async function getDocumentTypeById(
  id: string,
): Promise<DocumentTypeDTO | null> {
  const row = await prisma.documentType.findUnique({ where: { id } });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    fee: Number(row.fee),
    turnaroundDays: row.turnaroundDays,
    active: row.active,
    fields: parseDocumentFields(row.fields),
    template: row.template ?? null,
    paperSize: row.paperSize,
    orientation: row.orientation,
    requestCount: 0,
    updatedAt: null,
  };
}

/** Shape a resident's own request row into the shared DTO. */
function toMyRequestDTO(
  row: NonNullable<Awaited<ReturnType<typeof prisma.documentRequest.findFirst>>>,
): DocumentRequestDTO {
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    documentTypeId: row.documentTypeId,
    documentName: row.documentName,
    fee: Number(row.fee),
    purpose: row.purpose,
    method: row.method,
    paymentReference: row.paymentReference,
    proofImage: row.proofImage,
    orNumber: row.orNumber,
    status: row.status,
    note: row.note,
    resubmitNote: row.resubmitNote,
    requesterName: row.requesterName,
    requesterEmail: null,
    reviewedByName: null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    fieldValues: parseDocumentFieldValues(row.fieldValues),
    createdAt: row.createdAt.toISOString(),
  };
}

/** A resident's own document requests, newest first. */
export async function getMyDocumentRequests(
  userId: string,
): Promise<DocumentRequestDTO[]> {
  const rows = await prisma.documentRequest.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toMyRequestDTO);
}

/** A single one of the resident's own requests, or null if missing or not theirs. */
export async function getMyDocumentRequestById(
  userId: string,
  id: string,
): Promise<DocumentRequestDTO | null> {
  const row = await prisma.documentRequest.findFirst({
    where: { id, requesterId: userId },
  });
  return row ? toMyRequestDTO(row) : null;
}

/** The payment channels a resident can use, in display order, enabled only. */
export async function getEnabledPaymentMethods(): Promise<PaymentMethodDTO[]> {
  const rows = await prisma.paymentMethod.findMany({ where: { enabled: true } });
  const byType = new Map(rows.map((row) => [row.type, row]));

  return METHOD_ORDER.filter((type) => byType.has(type)).map((type) => {
    const row = byType.get(type)!;
    return {
      type: type as PaymentMethodType,
      enabled: true,
      accountName: row.accountName,
      accountNumber: row.accountNumber,
      qrImage: row.qrImage,
      instructions: row.instructions,
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

/** How many of a resident's requests were sent back and need their attention. */
export async function getActionNeededCount(userId: string): Promise<number> {
  return prisma.documentRequest.count({
    where: { requesterId: userId, status: "REJECTED" },
  });
}

/**
 * How many announcements the dedicated feed loads per "page". Small on purpose:
 * residents are often on budget phones over slow links, so we render a first
 * batch and let them pull the rest with a "Load more" button instead of
 * shipping every published notice (and every event image) up front.
 */
export const ANNOUNCEMENTS_PAGE_SIZE = 8;

export type AnnouncementsPage = {
  items: AnnouncementDTO[];
  /** Whether another page exists after this one. */
  hasMore: boolean;
};

/**
 * A page of published announcements, pinned first then newest, optionally
 * scoped to one category. `skip` is the number already shown; `take` defaults
 * to {@link ANNOUNCEMENTS_PAGE_SIZE}. We fetch one extra row to know whether a
 * "Load more" is worth offering without a second count query.
 */
export async function getPublishedAnnouncementsPage(opts: {
  skip?: number;
  take?: number;
  category?: AnnouncementCategory | null;
} = {}): Promise<AnnouncementsPage> {
  const take = opts.take ?? ANNOUNCEMENTS_PAGE_SIZE;
  const skip = opts.skip ?? 0;

  const rows = await prisma.announcement.findMany({
    where: {
      published: true,
      ...(opts.category ? { category: opts.category } : {}),
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    skip,
    take: take + 1,
    include: {
      author: { select: { name: true, firstName: true, lastName: true } },
    },
  });

  const hasMore = rows.length > take;
  const items = (hasMore ? rows.slice(0, take) : rows).map(toAnnouncementDTO);
  return { items, hasMore };
}
