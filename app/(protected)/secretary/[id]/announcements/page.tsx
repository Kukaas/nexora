import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAnnouncements } from "@/lib/secretary-data";
import { AnnouncementsManager } from "../../_components/announcements-manager";

export const metadata: Metadata = {
  title: "Announcements · Secretary · Barangay Libtangin",
};

export default async function SecretaryAnnouncementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const announcements = await getAnnouncements();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Barangay Announcements & Community Notices
          </h1>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Broadcast official notices, water/power advisories, vaccination drives, and community assembly updates to residents. Pin critical alerts or save draft notices to publish later.
          </p>
        </div>
        <Button asChild>
          <Link href={`/secretary/${id}/announcements/new`}>
            <Plus />
            New Announcement
          </Link>
        </Button>
      </header>

      <AnnouncementsManager
        announcements={announcements}
        basePath={`/secretary/${id}/announcements`}
      />
    </div>
  );
}
