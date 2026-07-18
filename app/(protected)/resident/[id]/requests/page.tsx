import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getMyDocumentRequests } from "@/lib/documents-data";
import { MyRequestsView } from "../../_components/my-requests-view";

export const metadata: Metadata = {
  title: "My requests · Barangay Libtangin",
};

export default async function ResidentRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // The list shows the signed-in resident's own requests, so a mismatched id in
  // the URL is sent back to their own portal.
  if (session.user.id !== id) redirect(`/resident/${session.user.id}`);

  const requests = await getMyDocumentRequests(session.user.id);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/resident/${id}`}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to portal
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My requests</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Every document you&apos;ve requested and where it stands.
        </p>
      </header>

      <MyRequestsView
        requests={requests}
        basePath={`/resident/${id}/requests`}
        requestHref={`/resident/${id}/request`}
      />
    </div>
  );
}
