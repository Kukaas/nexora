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

/**
 * The input kinds a secretary can give a custom field. "text" is always
 * available; the rest are opt-in per field. "select" carries `options`.
 */
export const DOCUMENT_FIELD_TYPES = [
  "text",
  "textarea",
  "date",
  "number",
  "select",
] as const;
export type DocumentFieldType = (typeof DOCUMENT_FIELD_TYPES)[number];

export const DOCUMENT_FIELD_TYPE_LABELS: Record<DocumentFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  date: "Date",
  number: "Number",
  select: "Dropdown",
};

/**
 * A custom field the secretary adds to a document type. Residents fill these in
 * when they request the document. Stored as JSON on the document type.
 */
export type DocumentField = {
  /** Stable key used as the form field id and to pair answers back to fields. */
  id: string;
  label: string;
  type: DocumentFieldType;
  required: boolean;
  /** Choices for a "select" field; empty for every other type. */
  options: string[];
};

/**
 * A resident's answer to one custom field, snapshotted onto the request at
 * submit time (label + type + value) so later edits to the field list never
 * rewrite past requests — the same way `documentName`/`fee` are snapshotted.
 */
export type DocumentFieldValue = {
  label: string;
  type: DocumentFieldType;
  value: string;
};

export type DocumentTypeDTO = {
  id: string;
  name: string;
  description: string | null;
  fee: number;
  turnaroundDays: number;
  active: boolean;
  /** Custom fields residents fill in when requesting this document. */
  fields: DocumentField[];
  /** How many requests reference this type, so the UI can warn before retiring. */
  requestCount: number;
  updatedAt: string | null;
};

export type DocumentRequestDTO = {
  id: string;
  referenceNumber: string;
  /** The catalog type this came from, or null if that type was deleted. */
  documentTypeId: string | null;
  documentName: string;
  fee: number;
  purpose: string | null;
  method: PaymentMethodType;
  paymentReference: string | null;
  proofImage: string | null;
  /** The Official Receipt number the treasurer recorded on verifying. */
  orNumber: string | null;
  status: DocumentRequestStatus;
  /** The reviewer's reason for sending the request back. */
  note: string | null;
  /** The resident's reply when they fix and resubmit a rejected request. */
  resubmitNote: string | null;
  requesterName: string;
  requesterEmail: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  releasedAt: string | null;
  /** The resident's answers to the document's custom fields, as submitted. */
  fieldValues: DocumentFieldValue[];
  createdAt: string;
};

export type RequestSummary = {
  pendingCount: number;
  processingCount: number;
  readyCount: number;
};

/** Per-status counts for the requests table tabs, plus the grand total. */
export type RequestStatusCounts = Record<DocumentRequestStatus, number> & {
  all: number;
};

/**
 * A server-paginated requests query. `status` "ALL" skips the status filter;
 * `start`/`end` are inclusive ISO bounds on `createdAt` (null = unbounded);
 * `page` is 1-based.
 */
export type RequestQuery = {
  status: DocumentRequestStatus | "ALL";
  start: string | null;
  end: string | null;
  page: number;
  pageSize: number;
};

/** One page of requests plus the totals the table needs to paginate. */
export type RequestPage = {
  items: DocumentRequestDTO[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AnnouncementDTO = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  published: boolean;
  place: string | null;
  /** When the event/advisory happens (ISO), distinct from `createdAt`; null if ongoing. */
  date: string | null;
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

/**
 * Read a document type's `fields` JSON column into a clean `DocumentField[]`,
 * tolerating anything malformed in the stored value. Used by the server data
 * loaders so the rest of the app always works with well-formed fields.
 */
export function parseDocumentFields(raw: unknown): DocumentField[] {
  if (!Array.isArray(raw)) return [];
  const fields: DocumentField[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const f = item as Record<string, unknown>;
    const label = typeof f.label === "string" ? f.label.trim() : "";
    if (!label) continue;
    const type = (DOCUMENT_FIELD_TYPES as readonly string[]).includes(
      f.type as string,
    )
      ? (f.type as DocumentFieldType)
      : "text";
    const options =
      type === "select" && Array.isArray(f.options)
        ? f.options.filter(
            (o): o is string => typeof o === "string" && o.trim().length > 0,
          )
        : [];
    fields.push({
      id: typeof f.id === "string" && f.id ? f.id : crypto.randomUUID(),
      label,
      type,
      required: f.required === true,
      options,
    });
  }
  return fields;
}

/** Read a request's `fieldValues` JSON column into a clean array for display. */
export function parseDocumentFieldValues(raw: unknown): DocumentFieldValue[] {
  if (!Array.isArray(raw)) return [];
  const values: DocumentFieldValue[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const label = typeof v.label === "string" ? v.label : "";
    if (!label) continue;
    const type = (DOCUMENT_FIELD_TYPES as readonly string[]).includes(
      v.type as string,
    )
      ? (v.type as DocumentFieldType)
      : "text";
    values.push({
      label,
      type,
      value: typeof v.value === "string" ? v.value : "",
    });
  }
  return values;
}

/** Render a submitted field value for display, e.g. spell out a date. */
export function formatFieldValue(field: {
  type: DocumentFieldType;
  value: string;
}): string {
  if (!field.value) return "—";
  if (field.type === "date") {
    const date = new Date(field.value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
  return field.value;
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
  [DocumentRequestStatus.CLAIMED]: "Claimed",
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
