import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import { getActiveDocumentTypes } from "@/lib/documents-data";
import { DocumentRequest } from "../../_components/document-request";

export const metadata: Metadata = {
  title: "Request a document · Barangay Libtangin",
};

export default async function ResidentRequestCatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // The catalog acts on the signed-in resident's behalf, so a mismatched id in
  // the URL is sent back to their own portal rather than someone else's.
  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  // Only verified residents can transact. Anyone still under review is bounced
  // back to the portal, where the review notice explains why.
  const residency = await getResidencyStatus(session.user.id);
  if (residency !== "approved") redirect(`/resident/${id}`);

  const types = await getActiveDocumentTypes();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={`/resident/${id}`}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to portal
      </Link>

      <div className="mt-4">
        <DocumentRequest types={types} basePath={`/resident/${id}`} />
      </div>
    </div>
  );
}
