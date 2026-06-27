import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";

/**
 * The resident portal lives at /resident/[id]. Landing on the bare /resident
 * forwards to the signed-in resident's own dashboard.
 */
export default async function ResidentIndex() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  redirect(`/resident/${session.user.id}`);
}
