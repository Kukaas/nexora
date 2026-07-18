import { redirect } from "next/navigation";

import { requireSession } from "@/lib/session";
import { resolveHomePath } from "@/lib/roles";
import { isProfileComplete, mustChangePassword } from "@/lib/profile";
import type { UserRoles } from "@/app/generated/prisma/enums";

/**
 * Post-login dispatcher. Both email and Google sign-in send users here; we read
 * their roles and forward them to the right home. This is the one place that
 * knows "where does this user belong", so the forms don't have to. A resident
 * who hasn't finished setup is sent there first.
 */
export default async function StartPage() {
  const session = await requireSession();

  // An admin-created official signing in with their temporary password must set
  // their own before they reach any role area.
  if (await mustChangePassword(session.user.id)) {
    redirect("/change-password");
  }

  const roles = session.user.roles as UserRoles[] | undefined;
  const home = resolveHomePath(roles);

  if (home === "/resident" && !(await isProfileComplete(session.user.id))) {
    redirect("/setup");
  }
  redirect(home);
}
