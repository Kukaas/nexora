import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getAvailableResidents, getHouseholdById } from "@/lib/household-data";
import { HouseholdDetail } from "../../../_components/household-detail";

export const metadata: Metadata = {
  title: "Household Details · Secretary · Barangay Libtangin",
};

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string; householdId: string }>;
}) {
  const { id, householdId } = await params;
  const [household, availableResidents] = await Promise.all([
    getHouseholdById(householdId),
    getAvailableResidents(),
  ]);

  if (!household) {
    notFound();
  }

  return (
    <div className="w-full">
      <HouseholdDetail
        household={household}
        basePath={`/secretary/${id}/households`}
        availableResidents={availableResidents}
      />
    </div>
  );
}
