import { redirect } from "next/navigation";

import { requireSession } from "@/lib/session";

/**
 * Bare `/kagawad` forwards to the kagawad's own id-scoped home
 * (`/kagawad/{userId}`), where the console lives. Mirrors `/secretary`.
 */
export default async function KagawadIndex() {
  const session = await requireSession();
  redirect(`/kagawad/${session.user.id}`);
}
