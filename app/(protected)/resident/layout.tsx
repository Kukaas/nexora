import { requireRole } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";

export default async function ResidentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.RESIDENT);
  return <>{children}</>;
}
