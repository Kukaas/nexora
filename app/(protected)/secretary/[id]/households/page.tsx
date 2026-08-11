import type { Metadata } from "next";

import { getCensusStats, getHouseholds } from "@/lib/household-data";
import { HouseholdList } from "../../_components/household-list";

export const metadata: Metadata = {
  title: "Households & Census · Secretary · Barangay Libtangin",
};

export default async function SecretaryHouseholdsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [households, censusStats] = await Promise.all([
    getHouseholds(),
    getCensusStats(),
  ]);

  return (
    <div className="w-full">
      <HouseholdList
        households={households}
        censusStats={censusStats}
        basePath={`/secretary/${id}/households`}
      />
    </div>
  );
}
