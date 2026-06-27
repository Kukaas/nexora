import { requireRole } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";

export default async function TreasurerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.TREASURER);
  return <>{children}</>;
}
