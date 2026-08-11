import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getBlotterRecordById } from "@/lib/blotter-data";
import { ResidentBlotterDetailView } from "../../../_components/resident-blotter-detail-view";

export const metadata: Metadata = {
  title: "Blotter Record Details · Resident Portal · Barangay Libtangin",
};

export default async function ResidentBlotterDetailPage({
  params,
}: {
  params: Promise<{ id: string; blotterId: string }>;
}) {
  const { id, blotterId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const record = await getBlotterRecordById(blotterId);
  if (!record || record.complainantId !== id) {
    notFound();
  }

  return (
    <ResidentBlotterDetailView
      record={record}
      residentId={id}
    />
  );
}
