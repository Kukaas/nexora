import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAssignedPurok } from "@/lib/kagawad-data";
import { AnnouncementForm } from "../../../../secretary/_components/announcement-form";

export const metadata: Metadata = {
  title: "New announcement · Kagawad · Barangay Libtangin",
};

export default async function NewKagawadAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purok = await getAssignedPurok(id);
  if (!purok) redirect(`/kagawad/${id}`);

  return (
    <AnnouncementForm
      editing={null}
      backHref={`/kagawad/${id}/announcements`}
      fixedPurok={purok}
    />
  );
}
