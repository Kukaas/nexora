import type { Metadata } from "next";

import { getCOACollectionReport } from "@/lib/financial-reports-data";
import { COAReportView } from "../../_components/coa-report-view";

export const metadata: Metadata = {
  title: "COA Financial Reports · Treasury · Barangay Libtangin",
};

export default async function TreasurerCOAReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { items, summary } = await getCOACollectionReport();

  return (
    <div className="w-full">
      <COAReportView
        initialItems={items}
        initialSummary={summary}
        basePath={`/treasurer/${id}/coa-reports`}
      />
    </div>
  );
}
