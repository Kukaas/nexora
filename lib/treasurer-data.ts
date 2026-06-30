import "server-only";

import { prisma } from "@/lib/prisma";
import {
  DocumentRequestStatus,
  PaymentStatus,
} from "@/app/generated/prisma/enums";
import {
  METHOD_ORDER,
  type PaymentDTO,
  type PaymentMethodDTO,
  type PaymentSummary,
} from "@/lib/payments";
import {
  parseDocumentFieldValues,
  type DocumentRequestDTO,
} from "@/lib/documents";

/**
 * Server-side read models for the treasurer screens. Everything returned here
 * is plain, serializable data (no Prisma `Decimal`, no `Date` objects passed to
 * client components): amounts become numbers and timestamps become ISO strings
 * at the boundary, so the values cross into client components without surprises.
 * Shared types and constants live in `@/lib/payments` (client-safe).
 */

export async function getPayments(
  status?: PaymentStatus,
): Promise<PaymentDTO[]> {
  const rows = await prisma.payment.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      payer: { select: { email: true } },
      reviewedBy: { select: { name: true, firstName: true, lastName: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    purpose: row.purpose,
    amount: Number(row.amount),
    method: row.method,
    referenceNumber: row.referenceNumber,
    proofImage: row.proofImage,
    status: row.status,
    reviewNote: row.reviewNote,
    payerName: row.payerName,
    payerEmail: row.payer?.email ?? null,
    reviewedByName: reviewerName(row.reviewedBy),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pending, verifiedThisMonth] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: PaymentStatus.PENDING },
      _count: true,
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.VERIFIED,
        reviewedAt: { gte: startOfMonth },
      },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  return {
    pendingCount: pending._count,
    pendingTotal: Number(pending._sum.amount ?? 0),
    verifiedThisMonth: verifiedThisMonth._count,
    verifiedThisMonthTotal: Number(verifiedThisMonth._sum.amount ?? 0),
  };
}

// ── Document-request fees ────────────────────────────────────────────────────
//
// Document requests carry their own payment (method, reference, proof) instead
// of a separate Payment row. The treasurer verifies that payment before the
// secretary prepares the document, so these reads power the treasurer's
// document-fees queue. Mirrors the request reads in `@/lib/secretary-data`.

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
    reviewedByName: reviewerName(row.reviewedBy),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    fieldValues: parseDocumentFieldValues(row.fieldValues),
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
    reviewedByName: reviewerName(row.reviewedBy),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    releasedAt: row.releasedAt?.toISOString() ?? null,
    fieldValues: parseDocumentFieldValues(row.fieldValues),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getDocumentFeeSummary(): Promise<{
  pendingCount: number;
  pendingTotal: number;
  clearedThisMonth: number;
  clearedThisMonthTotal: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [pending, cleared] = await Promise.all([
    prisma.documentRequest.aggregate({
      where: { status: DocumentRequestStatus.PENDING },
      _count: true,
      _sum: { fee: true },
    }),
    // "Cleared" = the treasurer verified the payment this month (it left PENDING
    // and wasn't rejected), regardless of where the secretary has taken it since.
    prisma.documentRequest.aggregate({
      where: {
        status: {
          in: [DocumentRequestStatus.PROCESSING, DocumentRequestStatus.READY],
        },
        reviewedAt: { gte: startOfMonth },
      },
      _count: true,
      _sum: { fee: true },
    }),
  ]);

  return {
    pendingCount: pending._count,
    pendingTotal: Number(pending._sum.fee ?? 0),
    clearedThisMonth: cleared._count,
    clearedThisMonthTotal: Number(cleared._sum.fee ?? 0),
  };
}

export async function getPaymentMethods(): Promise<PaymentMethodDTO[]> {
  const rows = await prisma.paymentMethod.findMany();
  const byType = new Map(rows.map((row) => [row.type, row]));

  // Always return all three channels in a stable order, falling back to a
  // blank, disabled default for any the treasurer hasn't set up yet.
  return METHOD_ORDER.map((type) => {
    const row = byType.get(type);
    return {
      type,
      enabled: row?.enabled ?? false,
      accountName: row?.accountName ?? null,
      accountNumber: row?.accountNumber ?? null,
      qrImage: row?.qrImage ?? null,
      instructions: row?.instructions ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  });
}

function reviewerName(
  reviewer: { name: string | null; firstName: string | null; lastName: string | null } | null,
): string | null {
  if (!reviewer) return null;
  const full = [reviewer.firstName, reviewer.lastName].filter(Boolean).join(" ");
  return full || reviewer.name || null;
}
