import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { getSession } from "@/lib/session";
import { getResidencyStatus } from "@/lib/profile";
import { ResubmitIdForm } from "../_components/resubmit-id-form";

export const metadata: Metadata = {
  title: "Resubmit your ID · Barangay Libtangin",
};

export default async function ResubmitIdPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  // Only a resident whose ID was rejected needs to resubmit. Anyone else (still
  // under review, or already verified) goes back to their portal.
  const status = await getResidencyStatus(session.user.id);
  if (status !== "rejected") redirect(`/resident/${session.user.id}`);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Link
        href={`/resident/${session.user.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to portal
      </Link>

      <header>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-balance">
          Resubmit your ID
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-pretty">
          Your previous ID couldn&apos;t be verified. Upload a clear photo of a
          valid government ID — this replaces the old one and sends it back to
          the barangay for review.
        </p>
      </header>

      <ResubmitIdForm />
    </div>
  );
}
