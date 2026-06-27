import { redirect } from "next/navigation";

import { requireRole } from "@/lib/session";
import { resolveHomePath } from "@/lib/roles";
import { isProfileComplete } from "@/lib/profile";
import { UserRoles } from "@/app/generated/prisma/enums";
import { ResidentShell } from "./_components/resident-shell";

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

  const u = session.user as {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    email: string;
    image?: string | null;
  };

  const name =
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    u.name?.trim() ||
    u.email;

  return (
    <ResidentShell
      user={{ id: u.id, name, initials: initialsOf(name), image: u.image }}
    >
      {children}
    </ResidentShell>
  );
}

/** Up to two initials from a display name, falling back to the first letter. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
