import { requireRole } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";

export default async function KagawadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(UserRoles.KAGAWAD);
  return <>{children}</>;
}
