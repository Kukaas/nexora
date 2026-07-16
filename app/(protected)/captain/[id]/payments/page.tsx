import type { Metadata } from "next";

import { getAnalyticsData } from "@/lib/captain-data";
import { CaptainPaymentsView } from "../../_components/captain-payments-view";

export const metadata: Metadata = {
  title: "Payments · Captain · Barangay Libtangin",
};

export default async function CaptainPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, { requests, generatedAt }] = await Promise.all([
    params,
    getAnalyticsData(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Document fees residents have paid and what the treasurer has
          verified. Filter, chart, export, or print the view.
        </p>
      </header>

      <CaptainPaymentsView
        requests={requests}
        generatedAt={generatedAt}
        detailBasePath={`/captain/${id}/requests`}
      />
    </div>
  );
}
