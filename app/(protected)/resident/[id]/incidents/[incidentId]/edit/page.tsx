import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getIncidentReportById } from "@/lib/incidents-data";
import { ResidentIncidentEditForm } from "../../../../_components/resident-incident-edit-form";

export const metadata: Metadata = {
  title: "Edit Incident Report · Resident Portal · Barangay Libtangin",
};

export default async function ResidentEditIncidentPage({
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

  if (incident.status !== "SUBMITTED") {
    redirect(`/resident/${id}/incidents/${incidentId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/resident/${id}/incidents/${incidentId}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to report details
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Edit Incident Report #{incident.reportNumber}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl text-pretty">
          Update the details, classification, date, location, or attached proof file for your submitted report.
        </p>
      </header>

      <ResidentIncidentEditForm
        incident={incident}
        residentId={id}
      />
    </div>
  );
}
