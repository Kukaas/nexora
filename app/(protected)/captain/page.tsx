import { redirect } from "next/navigation";

import { requireSession } from "@/lib/session";

/**
 * Bare `/captain` forwards to the captain's own id-scoped home
 * (`/captain/{userId}`), where the dashboard lives. Keeping the canonical URL
 * id-scoped means the captain's links are stable and unambiguous, matching the
 * secretary and treasurer areas.
 */
export default async function CaptainIndex() {
  const session = await requireSession();
  redirect(`/captain/${session.user.id}`);
}
