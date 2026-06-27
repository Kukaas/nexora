import { redirect } from "next/navigation";

import { requireRole } from "@/lib/session";
import { resolveHomePath } from "@/lib/roles";
import { isProfileComplete } from "@/lib/profile";
import { UserRoles } from "@/app/generated/prisma/enums";

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(UserRoles.RESIDENT);
  const roles = session.user.roles as UserRoles[] | undefined;

  // Gate genuine residents behind setup. Officials (e.g. an admin viewing this
  // area) resolve to a different home, so they're not forced through /setup.
  if (
    resolveHomePath(roles) === "/resident" &&
    !(await isProfileComplete(session.user.id))
  ) {
    redirect("/setup");
  }

  return <>{children}</>;
}
