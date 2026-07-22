import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/**
 * Sitemap for the crawlable, public surface of the site. Authenticated areas
 * ((protected)/*, /start) and API routes are intentionally excluded — they
 * require a session and shouldn't be indexed. Add new public marketing/auth
 * pages here as they appear.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/sign-in", changeFrequency: "monthly", priority: 0.6 },
    { path: "/sign-up", changeFrequency: "monthly", priority: 0.6 },
    { path: "/forgot-password", changeFrequency: "yearly", priority: 0.3 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
