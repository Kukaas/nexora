import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getIncidentReportById } from "@/lib/incidents-data";
import { ResidentIncidentDetailView } from "../../../_components/resident-incident-detail-view";

export const metadata: Metadata = {
  title: "Incident Report Details · Resident Portal · Barangay Libtangin",
};

export default async function ResidentIncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string; incidentId: string }>;
}) {
  const { id, incidentId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const incident = await getIncidentReportById(incidentId);
  if (!incident || incident.reporterId !== id) {
    notFound();
  }

  return (
    <ResidentIncidentDetailView
      incident={incident}
      residentId={id}
    />
  );
}
