import { redirect } from "next/navigation";

import { requireSession } from "@/lib/session";
import { resolveHomePath } from "@/lib/roles";
import type { UserRoles } from "@/app/generated/prisma/enums";

/**
 * Post-login dispatcher. Both email and Google sign-in send users here; we read
 * their roles and forward them to the right home. This is the one place that
 * knows "where does this user belong", so the forms don't have to.
 */
export default async function StartPage() {
  const session = await requireSession();
  const roles = session.user.roles as UserRoles[] | undefined;
  redirect(resolveHomePath(roles));
}
