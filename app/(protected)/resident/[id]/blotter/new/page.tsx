import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import { getIncidentReportById } from "@/lib/incidents-data";
import {
  ResidentBlotterForm,
  type ResidentBlotterInitialValues,
} from "../../../_components/resident-blotter-form";
import type { IncidentType } from "@/lib/blotter-data";

export const metadata: Metadata = {
  title: "File Incident Report · Resident Portal · Barangay Libtangin",
};

export default async function ResidentNewBlotterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    type?: string;
    incidentType?: string;
    location?: string;
    incidentLocation?: string;
    respondent?: string;
    respondentName?: string;
    respondentAddress?: string;
    narrative?: string;
    contact?: string;
    fromIncident?: string;
    incidentId?: string;
  }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;

  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const residency = await getResidencyStatus(session.user.id);
  if (residency !== "approved") redirect(`/resident/${id}/blotter`);

  // Fetch full resident profile details directly from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      firstName: true,
      lastName: true,
      mobileNumber: true,
      purok: true,
    },
  });

  const complainantName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.name?.trim() ||
    "Verified Resident";

  const userMobile = user?.mobileNumber ?? undefined;
  const defaultPurok = user?.purok
    ? `Purok ${user.purok.replace(/^PUROK_/, "")}, Barangay Libtangin`
    : undefined;

  // Build prefilled initial values from searchParams and incident conversion
  const initialValues: ResidentBlotterInitialValues = {};

  const targetIncidentId = sParams.incidentId || sParams.fromIncident;
  if (targetIncidentId) {
    const inc = await getIncidentReportById(targetIncidentId);
    if (inc) {
      initialValues.incidentLocation = inc.location;
      initialValues.narrative = `Escalated from Incident Report #${inc.reportNumber} (${inc.title}):\n\n${inc.description}`;
      if (inc.reporterContact) initialValues.contactDigits = inc.reporterContact;
      if (inc.attachmentUrl) initialValues.attachmentUrl = inc.attachmentUrl;

      const cat = inc.category?.toUpperCase() || "";
      if (cat.includes("NOISE")) initialValues.incidentType = "NOISE_COMPLAINT";
      else if (cat.includes("DISPUTE") || cat.includes("NEIGHBOR")) initialValues.incidentType = "NEIGHBOR_DISPUTE";
      else if (cat.includes("INJURY") || cat.includes("ASSAULT")) initialValues.incidentType = "PHYSICAL_INJURY";
      else if (cat.includes("DAMAGE") || cat.includes("VANDALISM")) initialValues.incidentType = "PROPERTY_DAMAGE";
      else if (cat.includes("THEFT") || cat.includes("BURGLARY")) initialValues.incidentType = "THEFT";
      else if (cat.includes("THREAT") || cat.includes("HARASSMENT")) initialValues.incidentType = "THREATS";
      else if (cat.includes("DOMESTIC") || cat.includes("FAMILY")) initialValues.incidentType = "DOMESTIC";
    }
  }

  // Explicit URL query overrides
  const rawType = (sParams.type || sParams.incidentType)?.toUpperCase() as IncidentType | undefined;
  if (rawType && ["NEIGHBOR_DISPUTE", "NOISE_COMPLAINT", "PHYSICAL_INJURY", "PROPERTY_DAMAGE", "THEFT", "THREATS", "DOMESTIC", "OTHER"].includes(rawType)) {
    initialValues.incidentType = rawType;
  }
  if (sParams.location || sParams.incidentLocation) {
    initialValues.incidentLocation = sParams.location || sParams.incidentLocation;
  }
  if (sParams.respondent || sParams.respondentName) {
    initialValues.respondentName = sParams.respondent || sParams.respondentName;
  }
  if (sParams.respondentAddress) {
    initialValues.respondentAddress = sParams.respondentAddress;
  }
  if (sParams.narrative) {
    initialValues.narrative = sParams.narrative;
  }
  if (sParams.contact) {
    initialValues.contactDigits = sParams.contact;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/resident/${id}/blotter`}
          className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to blotter reports
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          File an Incident / Blotter Report
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl text-pretty">
          Report a dispute or community incident to barangay officials. Your report will be logged and reviewed by the Secretary and Lupon Tagapamayapa.
        </p>
      </header>

      <ResidentBlotterForm
        residentId={id}
        complainantName={complainantName}
        defaultContact={userMobile}
        defaultPurok={defaultPurok}
        verified={true}
        initialValues={initialValues}
      />
    </div>
  );
}
