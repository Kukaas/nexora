import { requireRole } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";

export default async function SecretaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.SECRETARY);
  return <>{children}</>;
}
