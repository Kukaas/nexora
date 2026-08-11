import type { Metadata } from "next";

import { getBlotterRecords } from "@/lib/blotter-data";
import { BlotterList } from "../../_components/blotter-list";

export const metadata: Metadata = {
  title: "Blotter & Incident Records · Secretary · Barangay Libtangin",
};

export default async function SecretaryBlotterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const records = await getBlotterRecords();

  return (
    <div className="w-full">
      <BlotterList records={records} basePath={`/secretary/${id}/blotter`} />
    </div>
  );
}
