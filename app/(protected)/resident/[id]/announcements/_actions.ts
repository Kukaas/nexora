"use server";

import { getSession } from "@/lib/session";
import {
  ANNOUNCEMENTS_PAGE_SIZE,
  getPublishedAnnouncementsPage,
  type AnnouncementsPage,
} from "@/lib/documents-data";
import { AnnouncementCategory } from "@/app/generated/prisma/enums";

const VALID_CATEGORIES = new Set<string>(Object.values(AnnouncementCategory));

/**
 * Fetch the next page of published announcements for the resident feed. Called
 * by the "Load more" button and the category filter, which re-query from the
 * top. Published announcements are public to any signed-in resident, so this
 * only needs a session, not verification.
 */
export async function loadAnnouncements(input: {
  skip: number;
  category: string | null;
}): Promise<AnnouncementsPage> {
  const session = await getSession();
  if (!session) return { items: [], hasMore: false };

  const category =
    input.category && VALID_CATEGORIES.has(input.category)
      ? (input.category as AnnouncementCategory)
      : null;

  // Clamp skip to non-negative whole pages so a tampered value can't page past
  // the data or request an unbounded offset.
  const skip = Math.max(0, Math.floor(input.skip)) || 0;

  return getPublishedAnnouncementsPage({
    skip,
    take: ANNOUNCEMENTS_PAGE_SIZE,
    category,
  });
}
