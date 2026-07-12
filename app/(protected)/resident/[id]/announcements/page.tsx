import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getPublishedAnnouncementsPage } from "@/lib/documents-data";
import { BARANGAY } from "@/lib/documents";
import { AnnouncementsBoard } from "../../_components/announcements-board";

export const metadata: Metadata = {
  title: "Announcements · Barangay Libtangin",
  description:
    "Notices and events from Barangay Libtangin, Gasan, Marinduque.",
};

export default async function ResidentAnnouncementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // Like the dashboard, the portal is scoped to the signed-in resident; a
  // mismatched id in the URL bounces back to their own space.
  if (session.user.id !== id) redirect(`/resident/${session.user.id}/announcements`);

  const { items, hasMore } = await getPublishedAnnouncementsPage();

  return (
    <div className="w-full">
      <Link
        href={`/resident/${id}`}
        className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to overview
      </Link>

      <header className="mt-4 mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Announcements
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
          Notices and events from {BARANGAY.name}, {BARANGAY.area}.
        </p>
      </header>

      <AnnouncementsBoard initialItems={items} initialHasMore={hasMore} />
    </div>
  );
}
