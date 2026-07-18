import { requireRole } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";
import { AdminShell } from "./_components/admin-shell";
import { initialsOf } from "./_data";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(UserRoles.ADMIN);

  const u = session.user as {
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
    <AdminShell user={{ name, initials: initialsOf(name), image: u.image }}>
      {children}
    </AdminShell>
  );
}
