import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAssignedPurok } from "@/lib/kagawad-data";
import { getAnnouncements } from "@/lib/secretary-data";
import { purokLabel } from "@/lib/purok";
import { AnnouncementsManager } from "../../../secretary/_components/announcements-manager";

export const metadata: Metadata = {
  title: "Announcements · Kagawad · Barangay Libtangin",
};

export default async function KagawadAnnouncementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purok = await getAssignedPurok(id);
  // Without an assigned purok there's nothing to list or post; the overview
  // explains how to get one.
  if (!purok) redirect(`/kagawad/${id}`);

  const announcements = await getAnnouncements({ purok });

  return (
    <div>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {purokLabel(purok)} announcements
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Notices for your purok&apos;s residents. They see these alongside the
          barangay-wide news in their feed.
        </p>
      </header>

      <div className="mt-8">
        <AnnouncementsManager
          announcements={announcements}
          basePath={`/kagawad/${id}/announcements`}
          showAudience={false}
        />
      </div>
    </div>
  );
}
