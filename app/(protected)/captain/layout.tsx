import { requireRole } from "@/lib/session";
import { getRequestSummary } from "@/lib/secretary-data";
import { getDocumentFeeSummary } from "@/lib/treasurer-data";
import { UserRoles } from "@/app/generated/prisma/enums";
import { CaptainShell } from "./_components/captain-shell";

export default async function CaptainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole(UserRoles.CAPTAIN);
  const [requests, fees] = await Promise.all([
    getRequestSummary(),
    getDocumentFeeSummary(),
  ]);

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
    <CaptainShell
      user={{ id: u.id, name, initials: initialsOf(name), image: u.image }}
      requestsInProgressCount={requests.pendingCount + requests.processingCount}
      paymentsPendingCount={fees.pendingCount}
    >
      {children}
    </CaptainShell>
  );
}

/** Up to two initials from a display name, falling back to the first letter. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
