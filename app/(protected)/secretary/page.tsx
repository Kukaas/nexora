import { redirect } from "next/navigation";

import { requireSession } from "@/lib/session";

/**
 * Bare `/secretary` forwards to the secretary's own id-scoped home
 * (`/secretary/{userId}`), where the console lives. Keeping the canonical URL
 * id-scoped means a secretary's links are stable and unambiguous.
 */
export default async function SecretaryIndex() {
  const session = await requireSession();
  redirect(`/secretary/${session.user.id}`);
}
