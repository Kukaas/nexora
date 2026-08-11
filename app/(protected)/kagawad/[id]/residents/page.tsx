import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAssignedPurok, getPurokResidents } from "@/lib/kagawad-data";
import { purokLabel } from "@/lib/purok";
import { PurokResidentsView } from "@/app/(protected)/kagawad/_components/purok-residents-view";

export const metadata: Metadata = {
  title: "Residents · Kagawad · Barangay Libtangin",
};

export default async function KagawadResidentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purok = await getAssignedPurok(id);
  if (!purok) redirect(`/kagawad/${id}`);

  const residents = await getPurokResidents(purok);
  const label = purokLabel(purok);
  const basePath = `/kagawad/${id}/residents`;

  return (
    <PurokResidentsView
      purokLabel={label}
      residents={residents}
      basePath={basePath}
    />
  );
}
