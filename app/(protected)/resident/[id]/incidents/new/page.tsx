import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import { ResidentIncidentForm } from "../../../_components/resident-incident-form";

export const metadata: Metadata = {
  title: "Report Community Incident · Resident Portal · Barangay Libtangin",
};

export default async function ResidentNewIncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const residency = await getResidencyStatus(session.user.id);
  if (residency !== "approved") redirect(`/resident/${id}/incidents`);

  const userMobile = (session.user as { mobileNumber?: string | null }).mobileNumber ?? undefined;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/resident/${id}/incidents`}
          className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to incident reports
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Report a Community Incident
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl text-pretty">
          Report a disturbance, hazard, stray animal, or community issue to barangay officials for review and assistance.
        </p>
      </header>

      <ResidentIncidentForm
        residentId={id}
        defaultContact={userMobile}
        verified={true}
      />
    </div>
  );
}
