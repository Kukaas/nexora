/**
 * Canonical, crawlable facts about the site. Used by the root metadata, the
 * sitemap, robots, and the JSON-LD structured data on the homepage so search
 * engines see one consistent set of names, URLs, and descriptions.
 *
 * SITE_URL resolves from NEXT_PUBLIC_SITE_URL, falling back to the auth base
 * URL, then the production domain. Set NEXT_PUBLIC_SITE_URL in production so the
 * sitemap and canonical/OG URLs are absolute and correct.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
  "https://nexora.ph"
).replace(/\/$/, "");

export const SITE_NAME = "Nexora";

/**
 * The barangay's local timezone. Timestamps are stored as UTC instants in the
 * database; every date/time shown to a user must be formatted in this zone so it
 * reads as local time regardless of where the server (or the viewer's browser)
 * runs. Pass it as `timeZone` to every `Intl.DateTimeFormat` / `toLocale*` call.
 */
export const APP_TIME_ZONE = "Asia/Manila";

export const BARANGAY = {
  name: "Barangay Libtangin",
  locality: "Gasan",
  province: "Marinduque",
  region: "MIMAROPA",
  country: "PH",
  postalCode: "4905",
  streetAddress: "Barangay Hall, Libtangin",
} as const;

/**
 * The people behind the project. Listed as creators in metadata and as the
 * `founder`/`author` in structured data so searches for their names surface the
 * site.
 */
export const CREATORS = [{ name: "Chester Luke Maligaso", alternateName: "Kukaass" }] as const;

export const SITE_DESCRIPTION =
  "Official online services of Barangay Libtangin, Gasan, Marinduque, powered by Nexora. Residents can request clearances, certificates, and permits, track each request, and verify any document by its QR code.";

/**
 * Search keywords. Kept explicit so the terms the barangay and its residents
 * actually search for — the place, the platform, and the makers — are declared
 * on the page.
 */
export const SITE_KEYWORDS = [
  "Nexora",
  "Barangay Libtangin",
  "Libtangin",
  "Libtangin, Gasan, Marinduque",
  "Gasan",
  "Marinduque",
  "barangay clearance",
  "certificate of residency",
  "certificate of indigency",
  "barangay business permit",
  "barangay services online",
  "document verification",
  "Chester Luke Maligaso",
  "Kukaass",
];
