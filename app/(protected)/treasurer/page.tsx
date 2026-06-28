import { redirect } from "next/navigation";

import { requireSession } from "@/lib/session";

/**
 * Bare `/treasurer` forwards to the treasurer's own id-scoped home
 * (`/treasurer/{userId}`), where the portal lives. Keeping the canonical URL
 * id-scoped means a treasurer's links are stable and unambiguous.
 */
export default async function TreasurerIndex() {
  const session = await requireSession();
  redirect(`/treasurer/${session.user.id}`);
}
