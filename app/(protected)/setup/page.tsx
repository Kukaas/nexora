import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { requireSession } from "@/lib/session";
import { isProfileComplete } from "@/lib/profile";
import { resolveHomePath } from "@/lib/roles";
import type { UserRoles } from "@/app/generated/prisma/enums";
import { NexoraMark } from "@/app/(auth)/_components/nexora-mark";
import { SetupForm } from "./_components/setup-form";

export const metadata: Metadata = {
  title: "Complete your profile · Barangay Libtangin",
  description:
    "Add your details and a valid ID so the barangay can verify your account.",
};

export default async function SetupPage() {
  const session = await requireSession();
  const roles = session.user.roles as UserRoles[] | undefined;

  // Already done? Send them to where they belong.
  if (await isProfileComplete(session.user.id)) {
    redirect(resolveHomePath(roles));
  }

  return (
    <>
      <main className="mx-auto w-full max-w-xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 inline-flex w-fit items-center gap-2.5">
          <NexoraMark />
          <span aria-hidden className="h-5 w-px bg-border" />
          <span className="text-sm font-medium text-foreground">
            Barangay Libtangin
          </span>
        </div>

        <SetupForm email={session.user.email} />

        <p className="mt-8 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          Your ID is used only to verify your residency. An official reviews it,
          then your account is ready for requests.
        </p>
      </main>

      <Toaster position="top-center" richColors />
    </>
  );
}
