import type { Metadata } from "next";

import { AnnouncementForm } from "../../../_components/announcement-form";

export const metadata: Metadata = {
  title: "New announcement · Secretary · Barangay Libtangin",
};

export default async function NewAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AnnouncementForm
      editing={null}
      backHref={`/secretary/${id}/announcements`}
    />
  );
}
