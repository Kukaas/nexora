import type { Metadata } from "next";

import { getAnnouncements } from "@/lib/secretary-data";
import { AnnouncementsManager } from "../../_components/announcements-manager";

export const metadata: Metadata = {
  title: "Announcements · Secretary · Barangay Libtangin",
};

export default async function SecretaryAnnouncementsPage() {
  const announcements = await getAnnouncements();

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Post notices for residents. Pin the important ones to the top, or save
          a draft to publish later.
        </p>
      </header>

      <div className="mt-8">
        <AnnouncementsManager announcements={announcements} />
      </div>
    </div>
  );
}
