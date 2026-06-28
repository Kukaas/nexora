/**
 * Small client-safe helpers and types shared by the resident portal UI.
 *
 * The announcements, document catalog, and request list are now read from the
 * database (see `@/lib/documents-data`); what remains here is the resident-facing
 * request-status vocabulary and the date formatters used across the portal.
 */

export type RequestStatus = "issued" | "processing" | "submitted" | "action";

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
