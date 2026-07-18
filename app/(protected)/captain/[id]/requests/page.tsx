import type { Metadata } from "next";

import { getAnalyticsData } from "@/lib/captain-data";
import { CaptainRequestsView } from "../../_components/captain-requests-view";

export const metadata: Metadata = {
  title: "Requests · Captain · Barangay Libtangin",
};

export default async function CaptainRequestsPage({
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
        <h1 className="text-2xl font-semibold tracking-tight">
          Document requests
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Every request residents have made, from submission to claim. Filter,
          chart, export, or print the view; the secretary and treasurer act on
          them.
        </p>
      </header>

      <CaptainRequestsView
        requests={requests}
        generatedAt={generatedAt}
        basePath={`/captain/${id}/requests`}
      />
    </div>
  );
}
