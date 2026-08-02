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
  "https://nexora.kukaass.app"
).replace(/\/$/, "");

export const SITE_NAME = "Nexora";

/**
 * The name Google shows above the URL in a search result (its "site name"
 * feature). It must be the short name the site is *known by* — not a tagline
 * and not a title. A name built out of two clauses joined by a pipe reads as a
 * page title, so Google declines it and falls back to the domain, which for a
 * subdomain means the parent's name ("kukaass.app").
 *
 * Google ranks three signals, and wants all of them saying the same thing:
 * the `name` of the WebSite node in the homepage JSON-LD (highest), then
 * og:site_name, then the homepage <title> and headings. Every one of those must
 * read "Nexora" — see the homepage's `title.absolute`, which has to stay out of
 * the `%s | Nexora` template or the title contradicts the other two.
 */
export const SITE_DISPLAY_NAME = SITE_NAME;

/**
 * The other names this site answers to, offered to Google as fallbacks if it
 * declines SITE_DISPLAY_NAME, most to least preferred. The bare host is last:
 * Google documents a lowercase domain as the final backup, and naming ours
 * explicitly beats letting it inherit "kukaass.app" from the parent domain.
 */
export const SITE_ALTERNATE_NAMES = [
  "Barangay Libtangin",
  "Barangay Libtangin Online Services",
  "Nexora | Barangay Libtangin",
  SITE_URL.replace(/^https?:\/\//, ""),
];

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
