import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Let crawlers index the public marketing/auth pages, but keep them out of the
 * authenticated areas and API. Points at the generated sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/start",
        "/setup",
        "/change-password",
        "/messages",
        "/admin",
        "/resident",
        "/secretary",
        "/treasurer",
        "/captain",
        "/kagawad",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
