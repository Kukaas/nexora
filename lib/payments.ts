import {
  PaymentMethodType,
  PaymentStatus,
} from "@/app/generated/prisma/enums";

/**
 * Client-safe payment types and constants, shared by server data loaders and
 * the client treasurer UI. This module has no server-only dependencies (no
 * Prisma, no `server-only`) so it can be imported from client components
 * without pulling the database layer into the browser bundle.
 */

export type PaymentDTO = {
  id: string;
  purpose: string;
  amount: number;
  method: PaymentMethodType;
  referenceNumber: string | null;
  proofImage: string | null;
  status: PaymentStatus;
  reviewNote: string | null;
  payerName: string;
  payerEmail: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export type PaymentMethodDTO = {
  type: PaymentMethodType;
  enabled: boolean;
  accountName: string | null;
  accountNumber: string | null;
  qrImage: string | null;
  instructions: string | null;
  updatedAt: string | null;
};

export type PaymentSummary = {
  pendingCount: number;
  pendingTotal: number;
  verifiedThisMonth: number;
  verifiedThisMonthTotal: number;
};

/** Display label for each channel, used across the treasurer UI. */
export const METHOD_LABELS: Record<PaymentMethodType, string> = {
  [PaymentMethodType.GCASH]: "GCash",
  [PaymentMethodType.MAYA]: "Maya",
  [PaymentMethodType.CASH]: "Cash",
};

/** The order channels are presented in, e-wallets first. */
export const METHOD_ORDER: PaymentMethodType[] = [
  PaymentMethodType.GCASH,
  PaymentMethodType.MAYA,
  PaymentMethodType.CASH,
];
