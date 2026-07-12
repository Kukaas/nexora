import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getSignInMethods } from "@/lib/profile";
import { PasswordForm } from "../_components/password-form";

export const metadata: Metadata = {
  title: "Change password · Barangay Libtangin",
};

export default async function ChangePasswordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.id !== id) redirect(`/resident/${session.user.id}/profile`);

  const base = `/resident/${id}/profile`;

  // Only accounts that sign in with email + password have a password to change.
  // A Google-only resident is sent back to their profile.
  const { hasPassword } = await getSignInMethods(id);
  if (!hasPassword) redirect(base);

  return (
    <div className="w-full">
      <Link
        href={base}
        className="inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to profile
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-12">
        <div className="lg:pt-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Change password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Enter your current password, then choose a new one. You&apos;ll stay
            signed in on this device; other devices are signed out.
          </p>
        </div>

        <div className="max-w-lg">
          <PasswordForm backHref={base} />
        </div>
      </div>
    </div>
  );
}
