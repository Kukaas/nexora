import type { Metadata } from "next";

import { BlotterForm } from "../../../_components/blotter-form";
import { getAvailableResidents } from "@/lib/household-data";

export const metadata: Metadata = {
  title: "File Incident Blotter · Secretary · Barangay Libtangin",
};

export default async function NewBlotterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const residents = await getAvailableResidents();

  return (
    <div className="w-full">
      <BlotterForm basePath={`/secretary/${id}/blotter`} residents={residents} />
    </div>
  );
}
