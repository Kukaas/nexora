import {
  BARANGAY,
  CREATORS,
  SITE_ALTERNATE_NAMES,
  SITE_DESCRIPTION,
  SITE_DISPLAY_NAME,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site";

/**
 * Emits a JSON-LD <script> for search engines. Server component, so the graph
 * ships in the initial HTML with no client cost. Content is our own trusted
 * data, so JSON.stringify into a script tag is safe here.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Array<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- trusted, server-built graph
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/** The people behind Nexora, as schema.org Person nodes. */
const creatorNodes = CREATORS.map((c) => ({
  "@type": "Person",
  name: c.name,
  ...(c.alternateName ? { alternateName: c.alternateName } : {}),
}));

/**
 * The barangay-as-organization and the website itself. Declares the names a
 * search should match — "Nexora", "Barangay Libtangin", the location, and the
 * creators — and links the website to the org that publishes it.
 */
export const organizationLd: Record<string, unknown> = {
  "@type": "GovernmentOrganization",
  "@id": ORG_ID,
  name: BARANGAY.name,
  alternateName: ["Libtangin", "Barangay Libtangin, Gasan, Marinduque"],
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  logo: `${SITE_URL}/logo-with-text.png`,
  founder: creatorNodes,
  address: {
    "@type": "PostalAddress",
    streetAddress: BARANGAY.streetAddress,
    addressLocality: BARANGAY.locality,
    addressRegion: BARANGAY.province,
    postalCode: BARANGAY.postalCode,
    addressCountry: BARANGAY.country,
  },
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Barangay Libtangin, Gasan, Marinduque",
  },
};

export const websiteLd: Record<string, unknown> = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  // Drives the site name Google prints above the URL in a search result.
  name: SITE_DISPLAY_NAME,
  alternateName: SITE_ALTERNATE_NAMES,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: ["en-PH", "fil-PH"],
  publisher: { "@id": ORG_ID },
  creator: creatorNodes,
};

/**
 * Build a BreadcrumbList from a Home → … trail. Pass the trail *after* Home;
 * Home is prepended automatically. Emitting this lets Google render the
 * breadcrumb path in search results instead of a bare URL.
 */
export function breadcrumbLd(trail: Array<{ name: string; path: string }>): Record<string, unknown> {
  const items = [{ name: SITE_NAME, path: "/" }, ...trail];
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === "/" ? "" : item.path}`,
    })),
  };
}

/**
 * Wrap a set of nodes in a single @graph document so one <script> carries the
 * whole structured-data graph for a page.
 */
export function graph(...nodes: Array<Record<string, unknown>>): Record<string, unknown> {
  return { "@context": "https://schema.org", "@graph": nodes };
}
