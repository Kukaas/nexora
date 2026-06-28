import { requireRole } from "@/lib/session";
import { getPaymentSummary } from "@/lib/treasurer-data";
import { UserRoles } from "@/app/generated/prisma/enums";
import { TreasurerShell } from "./_components/treasurer-shell";

export default async function TreasurerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(UserRoles.TREASURER);
  const summary = await getPaymentSummary();

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
    <TreasurerShell
      user={{ id: u.id, name, initials: initialsOf(name), image: u.image }}
      pendingCount={summary.pendingCount}
    >
      {children}
    </TreasurerShell>
  );
}

/** Up to two initials from a display name, falling back to the first letter. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
