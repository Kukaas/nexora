import {
  AnnouncementCategory,
  DocumentRequestStatus,
  PaymentMethodType,
  type Purok,
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
  /** Tiptap HTML of the printed document layout; null until a layout is designed. */
  template: string | null;
  /** Paper size the layout is designed and printed at ("A4" | "Letter" | "Legal"). */
  paperSize: string;
  /** Page layout ("portrait" | "landscape"). */
  orientation: string;
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
  /** True for a walk-in request the secretary encoded for a resident without an account. */
  walkIn: boolean;
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

/** An image in the reusable document-designer media library. */
export type MediaAssetDTO = {
  id: string;
  url: string;
  name: string;
  createdAt: string;
};

export type AnnouncementDTO = {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  pinned: boolean;
  published: boolean;
  /** The venue within the barangay, e.g. "Barangay covered court"; null if none. */
  place: string | null;
  /** Latitude of the picked map point; null when no spot was set. */
  latitude: number | null;
  /** Longitude of the picked map point; null when no spot was set. */
  longitude: number | null;
  /** When the event/advisory happens (ISO), distinct from `createdAt`; null if ongoing. */
  date: string | null;
  /** Event start time as 24-hour "HH:MM"; null if none. */
  startTime: string | null;
  /** Event end time as 24-hour "HH:MM"; null for an open-ended or start-only time. */
  endTime: string | null;
  /** Cloudinary URL of the event image; null if none. */
  imageUrl: string | null;
  /** The purok this notice targets; null means barangay-wide. */
  purok: Purok | null;
  authorName: string | null;
  createdAt: string;
};

/**
 * Format a 24-hour "HH:MM" string as a friendly 12-hour time, e.g. "08:00" →
 * "8:00 AM", "12:00" → "12:00 NN", "00:00" → "12:00 MN". Returns null for a
 * missing or malformed value so callers can skip it.
 */
export function formatClockTime(hhmm: string | null): string | null {
  if (!hhmm) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  if (hours === 12 && minutes === 0) return "12:00 NN";
  if (hours === 0 && minutes === 0) return "12:00 MN";
  const period = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * Render an event's time as a single label: a range when both ends are set
 * ("8:00 AM – 12:00 NN"), the start alone, "Until …" for an end-only time, or
 * null when there's no time to show.
 */
export function formatTimeRange(
  startTime: string | null,
  endTime: string | null,
): string | null {
  const start = formatClockTime(startTime);
  const end = formatClockTime(endTime);
  if (start && end) return `${start} – ${end}`;
  if (start) return start;
  if (end) return `Until ${end}`;
  return null;
}

/**
 * The one barangay this deployment serves. Every announcement happens here, so
 * the location UI is scoped to it: residents see the barangay name and a map
 * link, and the compose form offers its common venues as quick picks rather
 * than a free-for-all address field.
 */
export const BARANGAY = {
  name: "Barangay Libtangin",
  area: "Gasan, Marinduque",
  /** Deep link to the barangay on Google Maps (the pin, not a shared session). */
  mapUrl:
    "https://www.google.com/maps/search/?api=1&query=13.343895,121.8292161",
} as const;

/**
 * Map framing for Barangay Libtangin. The map (compose picker and resident
 * view) is locked to this box so a location can only be chosen within the
 * barangay — panning and zooming out past `bounds` / `minZoom` is disabled.
 * `center` is [lng, lat] to match MapLibre's coordinate order.
 */
export const LIBTANGIN_MAP = {
  center: [121.8298, 13.3464] as [number, number],
  defaultZoom: 15.5,
  minZoom: 13.4,
  // Esri's imagery for rural Libtangin is native only to z18; going past it
  // just upscales (blurs) the same tile, so 18 is the sharpest useful ceiling.
  maxZoom: 18,
  /** [west, south, east, north] degrees; frames the whole barangay + Ubong. */
  bounds: { west: 121.807, south: 13.324, east: 121.852, north: 13.364 },
} as const;

/**
 * Approximate boundary of Barangay Libtangin as a closed ring of [lng, lat]
 * points, drawn to enclose its landmarks (hall, court, school, health center,
 * chapel, market, Ubong) with a small margin. This is the "inside Libtangin"
 * region: it's highlighted on the map, used to warn when a spot is picked
 * outside it, and enforced on save. It's tighter than `LIBTANGIN_MAP.bounds`,
 * which only frames how far the map can pan.
 */
export const LIBTANGIN_BOUNDARY: [number, number][] = [
  [121.8225, 13.3495],
  [121.8265, 13.3512],
  [121.832, 13.351],
  [121.8355, 13.348],
  [121.8358, 13.3435],
  [121.832, 13.3405],
  [121.8255, 13.34],
  [121.8218, 13.343],
  [121.8215, 13.347],
  [121.8225, 13.3495],
];

/**
 * Whether a point lies inside the Libtangin boundary (ray-casting point-in-
 * polygon). Used by the compose map's warning and by the save guard, so the
 * client and server agree on what counts as "inside the barangay."
 */
export function isWithinLibtangin(longitude: number, latitude: number): boolean {
  const ring = LIBTANGIN_BOUNDARY;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > latitude !== yj > latitude &&
      longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Google Maps directions link to a specific picked point. */
export function directionsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export type LibtanginVenue = { name: string; lat: number; lng: number };

/**
 * Common places an announcement is held within Barangay Libtangin, each with an
 * approximate map point. Offered both as quick-pick chips and as labeled markers
 * on the compose map: picking one sets the venue name and drops the pin there,
 * which the secretary can then drag to the exact spot. The name field is still
 * free text, so anything not listed here can be typed in.
 */
export const LIBTANGIN_VENUES: LibtanginVenue[] = [
  { name: "Barangay Hall", lat: 13.347233, lng: 121.830501 },
  { name: "Libtangin Covered Court", lat: 13.347275, lng: 121.830356 },
  { name: "Day Care Center", lat: 13.347035, lng: 121.829967 },
  { name: "Libtangin Elementary School", lat: 13.347939, lng: 121.830191 },
  { name: "Libtangin Health Center", lat: 13.349245, lng: 121.832562 },
  { name: "Libtangin Chapel", lat: 13.345825, lng: 121.828538 },
  { name: "Tiangge Market", lat: 13.34802, lng: 121.83203 },
  { name: "Ubong Court", lat: 13.342725, lng: 121.823923 },
];

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

/**
 * Placeholders a template can reference that don't come from the resident's
 * custom-field answers. The secretary drops these into the layout and they're
 * resolved per request at print time. `key` is the stable token stored in the
 * HTML (`data-key`); `label` is what the chip and the insert menu show.
 */
export const MERGE_SYSTEM_TOKENS = [
  { key: "requesterName", label: "Requester name" },
  { key: "documentName", label: "Document name" },
  { key: "purpose", label: "Purpose" },
  { key: "referenceNumber", label: "Reference number" },
  { key: "orNumber", label: "OR number" },
  { key: "fee", label: "Fee" },
  { key: "dateIssued", label: "Date issued" },
] as const;

export type MergeSystemKey = (typeof MERGE_SYSTEM_TOKENS)[number]["key"];

/**
 * The paper sizes a document layout can be designed and printed at. `width`/
 * `height` drive the on-screen sheet; `css` is the named size for `@page` when
 * printing. Portrait only — barangay documents are effectively always portrait.
 */
export const PAPER_SIZES = [
  { value: "A4", label: "A4", css: "A4", width: "210mm", height: "297mm" },
  {
    value: "Letter",
    label: "Letter",
    css: "letter",
    width: "216mm",
    height: "279mm",
  },
  {
    value: "Legal",
    label: "Legal",
    css: "legal",
    width: "216mm",
    height: "356mm",
  },
] as const;

export type PaperSize = (typeof PAPER_SIZES)[number]["value"];

/** Look up a paper size by value, falling back to A4 for anything unknown. */
export function paperSizeOf(value: string): (typeof PAPER_SIZES)[number] {
  return PAPER_SIZES.find((s) => s.value === value) ?? PAPER_SIZES[0];
}

export const ORIENTATIONS = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
] as const;

export type Orientation = (typeof ORIENTATIONS)[number]["value"];

/** CSS px for a paper dimension given in millimetres (96dpi, the print baseline). */
export function mmToPx(mm: string): number {
  return (parseFloat(mm) * 96) / 25.4;
}

/**
 * Resolve a paper size + orientation into the values the sheet and print need:
 * `width`/`height` are the on-screen sheet dimensions (the long edge becomes the
 * width in landscape); `css` is the `@page size` token (e.g. "A4 landscape").
 */
export function paperLayout(
  sizeValue: string,
  orientation: string,
): { width: string; height: string; css: string } {
  const size = paperSizeOf(sizeValue);
  const landscape = orientation === "landscape";
  return {
    width: landscape ? size.height : size.width,
    height: landscape ? size.width : size.height,
    css: landscape ? `${size.css} landscape` : size.css,
  };
}

/** Format a peso amount the way the printed document should show it. */
function formatPeso(amount: number): string {
  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });
}

/** Format an ISO date (or "now") as a long en-PH date for a printed document. */
function formatIssuedDate(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Resolve every placeholder a template might reference for one request, keyed by
 * the token stored in the HTML: custom fields by their **label** (matching the
 * snapshot on the request), plus the system tokens above. The print view looks
 * each `data-key` up in this map. Missing custom answers resolve to "" so a
 * renamed/removed field prints blank rather than leaking the placeholder.
 */
export function buildMergeContext(
  request: DocumentRequestDTO,
): Record<string, string> {
  const context: Record<string, string> = {};

  // Custom fields, keyed by label (the request stores answers by label).
  for (const field of request.fieldValues) {
    context[field.label] = formatFieldValue(field);
  }

  // System tokens.
  context.requesterName = request.requesterName;
  context.documentName = request.documentName;
  context.purpose = request.purpose ?? "";
  context.referenceNumber = request.referenceNumber;
  context.orNumber = request.orNumber ?? "";
  context.fee = request.fee > 0 ? formatPeso(request.fee) : "Free";
  context.dateIssued = formatIssuedDate(request.releasedAt);

  return context;
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
