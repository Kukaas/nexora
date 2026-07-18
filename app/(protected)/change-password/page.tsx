import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { requireSession } from "@/lib/session";
import { mustChangePassword } from "@/lib/profile";
import { resolveHomePath } from "@/lib/roles";
import type { UserRoles } from "@/app/generated/prisma/enums";
import { NexoraMark } from "@/app/(auth)/_components/nexora-mark";
import { ChangePasswordForm } from "./_components/change-password-form";

export const metadata: Metadata = {
  title: "Set your password · Barangay Libtangin",
  description: "Replace your temporary password before you continue.",
};

export default async function ChangePasswordPage() {
  const session = await requireSession();
  const roles = session.user.roles as UserRoles[] | undefined;

  // Nothing to change? Send them on to their area.
  if (!(await mustChangePassword(session.user.id))) {
    redirect(resolveHomePath(roles));
  }

  return (
    <>
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-5 py-10 sm:px-6">
        <div className="mb-10 inline-flex w-fit items-center gap-2.5">
          <NexoraMark />
          <span aria-hidden className="h-5 w-px bg-border" />
          <span className="text-sm font-medium text-foreground">
            Barangay Libtangin
          </span>
        </div>

        <span className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <KeyRound className="size-5" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Set your password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          You signed in with a temporary password. Choose your own to finish
          setting up your account — you&apos;ll use it from now on.
        </p>

        <div className="mt-8">
          <ChangePasswordForm />
        </div>
      </main>

      <Toaster position="top-center" richColors />
    </>
  );
}
