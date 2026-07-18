import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getAssignedPurok } from "@/lib/kagawad-data";
import { getAnnouncementById } from "@/lib/secretary-data";
import { AnnouncementForm } from "../../../../../secretary/_components/announcement-form";

export const metadata: Metadata = {
  title: "Edit announcement · Kagawad · Barangay Libtangin",
};

export default async function EditKagawadAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string; announcementId: string }>;
}) {
  const { id, announcementId } = await params;
  const purok = await getAssignedPurok(id);
  if (!purok) redirect(`/kagawad/${id}`);

  const announcement = await getAnnouncementById(announcementId);
  // A kagawad only manages their own purok's notices; anything else is not
  // theirs to see. The server actions enforce the same rule on save/delete.
  if (!announcement || announcement.purok !== purok) notFound();

  return (
    <AnnouncementForm
      editing={announcement}
      backHref={`/kagawad/${id}/announcements`}
      fixedPurok={purok}
    />
  );
}
