import type { Metadata } from "next";

import { HouseholdForm } from "../../../_components/household-form";
import { getAvailableResidents } from "@/lib/household-data";

export const metadata: Metadata = {
  title: "Register Household · Secretary · Barangay Libtangin",
};

export default async function NewHouseholdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const residents = await getAvailableResidents();

  return (
    <div className="w-full">
      <HouseholdForm basePath={`/secretary/${id}/households`} residents={residents} />
    </div>
  );
}
