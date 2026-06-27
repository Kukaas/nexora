/**
 * Sample portal content for the resident dashboard.
 *
 * These are typed, curated stand-ins so the portal looks and behaves like the
 * real thing. There are no `Announcement` / `DocumentRequest` tables in the
 * schema yet; when those land, swap these constants for queries and keep the
 * same shapes. Nothing here is persisted or user-specific.
 */

export type AnnouncementCategory =
  | "advisory"
  | "health"
  | "events"
  | "assistance"
  | "governance";

export type Announcement = {
  id: string;
  category: AnnouncementCategory;
  title: string;
  summary: string;
  /** Longer body shown when the item is expanded. */
  detail: string;
  /** ISO date the notice was posted / takes effect. */
  date: string;
  /** Optional place the notice concerns. */
  place?: string;
  pinned?: boolean;
};

export type RequestStatus = "issued" | "processing" | "submitted" | "action";

export type DocumentRequest = {
  id: string;
  document: string;
  /** Machine-issued reference, shown in mono. */
  reference: string;
  status: RequestStatus;
  updatedAt: string;
};

export type DocumentTypeKey =
  | "clearance"
  | "residency"
  | "indigency"
  | "business";

export type DocumentType = {
  key: DocumentTypeKey;
  name: string;
  blurb: string;
  /** Typical turnaround, in plain language. */
  turnaround: string;
};

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  advisory: "Advisory",
  health: "Health",
  events: "Events",
  assistance: "Assistance",
  governance: "Governance",
};

/** Filter order for the announcement chips. */
export const CATEGORY_ORDER: AnnouncementCategory[] = [
  "advisory",
  "health",
  "assistance",
  "governance",
  "events",
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "anc-water-jun28",
    category: "advisory",
    title: "Scheduled water interruption, June 28",
    summary:
      "Maynilad will shut off supply for line maintenance from 10:00 PM Saturday to 4:00 AM Sunday.",
    detail:
      "Affected: Sitio Maligaya, Riverside, and the area around the covered court. Store enough water for the night and early morning. Service resumes gradually, so low pressure right after 4:00 AM is normal. Report no-water-by-morning to the barangay hall.",
    date: "2026-06-28",
    place: "Sitio Maligaya · Riverside",
    pinned: true,
  },
  {
    id: "anc-assembly-jul05",
    category: "governance",
    title: "Barangay general assembly, July 5",
    summary:
      "Quarterly assembly at the covered court, 8:00 AM. Budget update and the new waste plan will be presented.",
    detail:
      "Open to all residents. One representative per household is enough to be counted present. Bring questions for the open forum after the budget report. Attendance is recorded for households applying for assistance programs.",
    date: "2026-07-05",
    place: "Barangay covered court",
  },
  {
    id: "anc-rabies-jul02",
    category: "health",
    title: "Free anti-rabies vaccination for pets",
    summary:
      "Bring cats and dogs to the health center on July 2, 8:00 AM to 12:00 NN. No fee, first come first served.",
    detail:
      "Pets should be leashed or in a carrier. One handler per animal. Owners get a vaccination card for each pet. Supplies are limited to 200 doses for the day; an additional schedule will be posted if demand is high.",
    date: "2026-07-02",
    place: "Barangay health center",
  },
  {
    id: "anc-pension-jun30",
    category: "assistance",
    title: "Senior citizen pension payout",
    summary:
      "Social pension for the second quarter will be released June 30 to July 1 at the barangay hall.",
    detail:
      "Bring a valid ID and your OSCA booklet. Beneficiaries who cannot come in person may send an authorized representative with a signed authorization letter and both IDs. Payout runs 9:00 AM to 3:00 PM on both days.",
    date: "2026-06-30",
    place: "Barangay hall, second floor",
  },
  {
    id: "anc-garbage-jun27",
    category: "advisory",
    title: "New garbage collection days",
    summary:
      "Starting this week, biodegradable waste is collected Mondays and Thursdays; recyclables on Saturdays.",
    detail:
      "Please segregate at source. Collection starts at 6:00 AM, so set out bins the night before. Bulky items (furniture, appliances) are picked up on the last Saturday of the month only, by request at the hall.",
    date: "2026-06-27",
  },
  {
    id: "anc-fiesta-jul12",
    category: "events",
    title: "Barangay fiesta and fun run, July 12",
    summary:
      "Registration is open for the 5K fun run and the inter-sitio basketball league. Sign up at the hall.",
    detail:
      "Fun run gun start is 5:30 AM at the plaza; registration is free with a claimable shirt for the first 300 runners. The basketball league runs the whole month, with games every evening at the covered court. Team rosters are due July 8.",
    date: "2026-07-12",
    place: "Barangay plaza",
  },
];

export const MY_REQUESTS: DocumentRequest[] = [
  {
    id: "req-bc-0142",
    document: "Barangay clearance",
    reference: "BC-2026-0142",
    status: "issued",
    updatedAt: "2026-06-26",
  },
  {
    id: "req-ci-0211",
    document: "Certificate of indigency",
    reference: "CI-2026-0211",
    status: "processing",
    updatedAt: "2026-06-27",
  },
  {
    id: "req-bp-0098",
    document: "Barangay business permit",
    reference: "BP-2026-0098",
    status: "action",
    updatedAt: "2026-06-24",
  },
];

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    key: "clearance",
    name: "Barangay clearance",
    blurb: "For employment, permits, and IDs.",
    turnaround: "Ready in 1–2 days",
  },
  {
    key: "residency",
    name: "Certificate of residency",
    blurb: "Proof you live in the barangay.",
    turnaround: "Ready same day",
  },
  {
    key: "indigency",
    name: "Certificate of indigency",
    blurb: "For scholarships and medical aid.",
    turnaround: "Ready in 1–2 days",
  },
  {
    key: "business",
    name: "Business permit",
    blurb: "Barangay endorsement for a business.",
    turnaround: "Ready in 2–3 days",
  },
];

const MANILA = "Asia/Manila";

/** Compact date, e.g. "Jun 28". Fixed locale + tz so server and client agree. */
export function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: MANILA,
  }).format(new Date(iso));
}

/** Full date, e.g. "Friday, June 27, 2026". */
export function formatFullDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: MANILA,
  }).format(typeof date === "string" ? new Date(date) : date);
}
