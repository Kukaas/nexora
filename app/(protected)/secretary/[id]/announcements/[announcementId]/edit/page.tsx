import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAnnouncementById } from "@/lib/secretary-data";
import { AnnouncementForm } from "../../../../_components/announcement-form";

export const metadata: Metadata = {
  title: "Edit announcement · Secretary · Barangay Libtangin",
};

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string; announcementId: string }>;
}) {
  const { id, announcementId } = await params;
  const announcement = await getAnnouncementById(announcementId);
  if (!announcement) notFound();

  return (
    <AnnouncementForm
      editing={announcement}
      backHref={`/secretary/${id}/announcements`}
    />
  );
}
