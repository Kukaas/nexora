import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

/**
 * Placeholder dashboard shared by every role area until the real screens are
 * built. Shows who's signed in and which roles they hold, plus a sign-out
 * control so the routing can be exercised end-to-end.
 */
export async function RoleDashboard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const session = await getSession();
  // The protected layout already guaranteed a session; this is just a guard for
  // the type-narrowing (and a belt-and-suspenders redirect).
  if (!session) redirect("/sign-in");

  const { email, roles } = session.user as typeof session.user & {
    roles?: string[];
  };

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      </div>

      <dl className="grid gap-3 rounded-2xl border bg-card p-5 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Signed in as</dt>
          <dd className="font-medium break-all">{email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Roles</dt>
          <dd className="font-medium">{roles?.join(", ") || "—"}</dd>
        </div>
      </dl>

      <SignOutButton />
    </main>
  );
}
