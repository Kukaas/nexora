import "server-only";

import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/app/generated/prisma/enums";
import {
  METHOD_ORDER,
  type PaymentDTO,
  type PaymentMethodDTO,
  type PaymentSummary,
} from "@/lib/payments";

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
