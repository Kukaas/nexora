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
    // The content pages. Ranked above the auth forms because these are the ones
    // worth surfacing in search — the forms are destinations, not answers.
    { path: "/services", changeFrequency: "weekly", priority: 0.9 },
    { path: "/how-it-works", changeFrequency: "monthly", priority: 0.8 },
    { path: "/announcements", changeFrequency: "daily", priority: 0.8 },
    { path: "/verify", changeFrequency: "monthly", priority: 0.7 },
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
