import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getBlotterRecordById } from "@/lib/blotter-data";
import { BlotterUpdateForm } from "../../../_components/blotter-update-form";

export const metadata: Metadata = {
  title: "Blotter Record Details · Secretary · Barangay Libtangin",
};

export default async function BlotterDetailPage({
  params,
}: {
  params: Promise<{ id: string; blotterId: string }>;
}) {
  const { id, blotterId } = await params;
  const record = await getBlotterRecordById(blotterId);

  if (!record) {
    notFound();
  }

  return (
    <div className="w-full">
      <BlotterUpdateForm record={record} basePath={`/secretary/${id}/blotter`} />
    </div>
  );
}
