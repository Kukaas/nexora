import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import { ResidentBlotterForm } from "../../../_components/resident-blotter-form";

export const metadata: Metadata = {
  title: "File Incident Report · Resident Portal · Barangay Libtangin",
};

export default async function ResidentNewBlotterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const residency = await getResidencyStatus(session.user.id);
  if (residency !== "approved") redirect(`/resident/${id}/blotter`);

  const userMobile = (session.user as { mobileNumber?: string | null }).mobileNumber ?? undefined;

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
        defaultContact={userMobile}
        verified={true}
      />
    </div>
  );
}
