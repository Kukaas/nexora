import type { Metadata } from "next";

import { getDocumentTypes } from "@/lib/secretary-data";
import { WalkInRequestForm } from "../../../_components/walk-in-request-form";

export const metadata: Metadata = {
  title: "Walk-in request · Secretary · Barangay Libtangin",
};

export default async function NewWalkInRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Only active types are requestable — same rule as the resident portal.
  const types = (await getDocumentTypes()).filter((t) => t.active);

  return (
    <WalkInRequestForm types={types} basePath={`/secretary/${id}/requests`} />
  );
}
