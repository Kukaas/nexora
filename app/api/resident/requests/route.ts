import { getSession } from "@/lib/session";
import { getMyDocumentRequests } from "@/lib/documents-data";

/**
 * The signed-in resident's own document requests, as JSON. This is the client
 * query function behind the "My requests" cache: React Query hits it on refetch
 * (including when a socket `resident-requests` invalidation fires), while the
 * first paint is prefetched + hydrated server-side. Session-scoped, so it only
 * ever returns the caller's own requests.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await getMyDocumentRequests(session.user.id);
  return Response.json(requests, {
    headers: { "Cache-Control": "no-store" },
  });
}
