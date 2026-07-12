import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getSession } from "@/lib/session";
import { getResidentProfile } from "@/lib/profile";
import { ProfileForm } from "../_components/profile-form";

export const metadata: Metadata = {
  title: "Edit profile · Barangay Libtangin",
};

/** Up to two initials from a display name. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stored `+63XXXXXXXXXX` back to the local `09XXXXXXXXX` residents type. */
function toLocalMobile(mobile: string | null): string {
  if (!mobile) return "";
  const digits = mobile.replace(/[^\d]/g, "").replace(/^63/, "0");
  return digits.length === 11 ? digits : mobile;
}

export default async function EditProfilePage({
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
  const displayName =
    profile.name?.trim() ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.email;

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
            Edit profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Update your photo and personal details. These appear on the
            documents you request from the barangay.
          </p>
        </div>

        <div className="max-w-2xl">
          <ProfileForm
            initial={{
              firstName: profile.firstName ?? "",
              middleName: profile.middleName ?? "",
              lastName: profile.lastName ?? "",
              birthDate: profile.birthDate,
              mobileNumber: toLocalMobile(profile.mobileNumber),
              image: profile.image,
            }}
            initials={initialsOf(displayName)}
            residencyApproved={profile.residency === "approved"}
            backHref={base}
          />
        </div>
      </div>
    </div>
  );
}
