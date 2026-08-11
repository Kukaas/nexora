import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import { getResidentIncidents } from "@/lib/incidents-data";
import { ResidentIncidentList } from "../../_components/resident-incident-list";

export const metadata: Metadata = {
  title: "Incident Reports · Resident Portal · Barangay Libtangin",
};

export default async function ResidentIncidentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const residency = await getResidencyStatus(session.user.id);
  const incidents = await getResidentIncidents(id);

  return (
    <ResidentIncidentList
      residentId={id}
      incidents={incidents}
      verified={residency === "approved"}
      residencyStatus={residency}
    />
  );
}
