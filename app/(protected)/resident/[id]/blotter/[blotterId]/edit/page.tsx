import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getBlotterRecordById } from "@/lib/blotter-data";
import { ResidentBlotterEditForm } from "../../../../_components/resident-blotter-edit-form";

export const metadata: Metadata = {
  title: "Edit Blotter Record · Resident Portal · Barangay Libtangin",
};

export default async function ResidentEditBlotterPage({
  params,
}: {
  params: Promise<{ id: string; blotterId: string }>;
}) {
  const { id, blotterId } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const record = await getBlotterRecordById(blotterId);
  if (!record || record.complainantId !== id) {
    notFound();
  }

  if (record.status !== "FILED") {
    redirect(`/resident/${id}/blotter/${blotterId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/resident/${id}/blotter/${blotterId}`}
          className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to case details
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Edit Blotter Case #{record.caseNumber}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl text-pretty">
          Update the incident details, respondent information, narrative statement, or proof attachment for your filed blotter case.
        </p>
      </header>

      <ResidentBlotterEditForm
        record={record}
        residentId={id}
      />
    </div>
  );
}
