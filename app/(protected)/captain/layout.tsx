import { requireRole } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";

export default async function CaptainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.CAPTAIN);
  return <>{children}</>;
}
