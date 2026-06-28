import {
  AnnouncementCategory,
  DocumentRequestStatus,
  PaymentMethodType,
} from "@/app/generated/prisma/enums";

/**
 * Client-safe document & announcement types and constants, shared by the server
 * data loaders and the client secretary/resident UI. This module has no
 * server-only dependencies (no Prisma, no `server-only`), so it can be imported
 * from client components without pulling the database layer into the browser
 * bundle. Mirrors the split used by `@/lib/payments`.
 */

export type DocumentTypeDTO = {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  turnaroundDays: number;
  active: boolean;
  /** How many requests reference this type, so the UI can warn before retiring. */
  requestCount: number;
  updatedAt: string | null;
};

export type DocumentRequestDTO = {
  id: string;
  referenceNumber: string;
  documentName: string;
  fee: number;
  purpose: string | null;
  method: PaymentMethodType;
  paymentReference: string | null;
  proofImage: string | null;
  status: DocumentRequestStatus;
  note: string | null;
  requesterName: string;
  requesterEmail: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
};

export type RequestSummary = {
  pendingCount: number;
  processingCount: number;
  readyCount: number;
};

export type AnnouncementDTO = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  published: boolean;
  place: string | null;
  authorName: string | null;
  createdAt: string;
};

/**
 * Whether a request carries a payment worth reviewing. Free documents (no fee)
 * have nothing to pay, so their detail views skip the payment/proof block and
 * show basic info only.
 */
export function requestHasPayment(request: { fee: number }): boolean {
  return request.fee > 0;
}

/** Turnaround in plain language, e.g. "Ready same day" / "Ready in 2 days". */
export function turnaroundLabel(days: number): string {
  if (days <= 0) return "Ready same day";
  if (days === 1) return "Ready in 1 day";
  return `Ready in ${days} days`;
}

/** Display label for each document-request status. */
export const REQUEST_STATUS_LABELS: Record<DocumentRequestStatus, string> = {
  [DocumentRequestStatus.PENDING]: "Pending",
  [DocumentRequestStatus.PROCESSING]: "Processing",
  [DocumentRequestStatus.READY]: "Ready",
  [DocumentRequestStatus.REJECTED]: "Rejected",
};

/** Display label for each announcement category. */
export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  [AnnouncementCategory.ADVISORY]: "Advisory",
  [AnnouncementCategory.HEALTH]: "Health",
  [AnnouncementCategory.EVENTS]: "Events",
  [AnnouncementCategory.ASSISTANCE]: "Assistance",
  [AnnouncementCategory.GOVERNANCE]: "Governance",
};

/** Category order used for filter chips and the compose dropdown. */
export const CATEGORY_ORDER: AnnouncementCategory[] = [
  AnnouncementCategory.ADVISORY,
  AnnouncementCategory.HEALTH,
  AnnouncementCategory.ASSISTANCE,
  AnnouncementCategory.GOVERNANCE,
  AnnouncementCategory.EVENTS,
];
