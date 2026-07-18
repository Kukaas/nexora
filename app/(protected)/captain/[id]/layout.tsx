import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";

/**
 * The parent `captain/layout.tsx` already proved the caller holds the CAPTAIN
 * role (or is an admin) and renders the portal shell. Here we only pin the
 * URL's id to the signed-in captain so nobody browses another user's id-scoped
 * pages. Admins may view any id.
 */
export default async function CaptainIdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const roles = session.user.roles as UserRoles[] | undefined;
  const isAdmin = roles?.includes(UserRoles.ADMIN) ?? false;
  if (id !== session.user.id && !isAdmin) {
    redirect(`/captain/${session.user.id}`);
  }

  return <>{children}</>;
}
