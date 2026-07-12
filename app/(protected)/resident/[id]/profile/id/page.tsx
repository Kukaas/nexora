import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getResidentProfile } from "@/lib/profile";
import { IdEditForm } from "../_components/id-edit-form";

export const metadata: Metadata = {
  title: "Change your ID · Barangay Libtangin",
};

export default async function ChangeIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.user.id !== id) redirect(`/resident/${session.user.id}/profile`);

  const profile = await getResidentProfile(id);
  if (!profile) redirect(`/resident/${id}`);

  const base = `/resident/${id}/profile`;

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
            Change your ID
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Replace the government ID the barangay has on file. The new ID is
            reviewed before your account is verified again.
          </p>
        </div>

        <div className="max-w-2xl">
          <IdEditForm
            initial={{
              idType: profile.id?.type ?? "",
              idNumber: profile.id?.number ?? "",
              idFront: profile.id?.frontImage ?? "",
              idBack: profile.id?.backImage ?? "",
            }}
            backHref={base}
          />
        </div>
      </div>
    </div>
  );
}
