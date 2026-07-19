import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getSession } from "@/lib/session";
import { getMyDocumentRequests } from "@/lib/documents-data";
import { getQueryClient } from "@/lib/query/get-query-client";
import { queryKeys } from "@/lib/query/keys";
import { MyRequestsLive } from "../../_components/my-requests-live";

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

  // Prefetch on the server so the first paint is populated, then hand the cache
  // to the client (HydrationBoundary). From there the client owns it: tab
  // switches read cache, and a socket invalidation refetches it live.
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.residentRequests,
    queryFn: () => getMyDocumentRequests(session.user.id),
  });

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

      <HydrationBoundary state={dehydrate(queryClient)}>
        <MyRequestsLive
          basePath={`/resident/${id}/requests`}
          requestHref={`/resident/${id}/request`}
        />
      </HydrationBoundary>
    </div>
  );
}
