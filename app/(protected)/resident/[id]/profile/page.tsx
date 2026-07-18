import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  IdCard,
  KeyRound,
  Mail,
  Pencil,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";

import { getSession } from "@/lib/session";
import { getResidentProfile } from "@/lib/profile";
import { ID_TYPE_LABELS } from "@/lib/ids";
import { PUROK_LABELS } from "@/lib/purok";
import { IDStatus } from "@/app/generated/prisma/enums";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFullDate } from "../../_data";
import { IdPreview } from "./_components/id-preview";

export const metadata: Metadata = {
  title: "My profile · Barangay Libtangin",
};

/** Up to two initials from a display name. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Show a stored `+63XXXXXXXXXX` mobile as the familiar local `0917 123 4567`. */
function formatMobile(mobile: string | null): string {
  if (!mobile) return "Not set";
  const digits = mobile.replace(/[^\d]/g, "").replace(/^63/, "0");
  if (digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return mobile;
}

export default async function ResidentProfilePage({
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

  const displayName =
    profile.name?.trim() ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim() ||
    profile.email;
  const base = `/resident/${id}/profile`;

  return (
    <div className="w-full space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-16 ring-1 ring-foreground/10">
          {profile.image ? <AvatarImage src={profile.image} alt="" /> : null}
          <AvatarFallback className="text-xl font-medium">
            {initialsOf(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {displayName}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 break-all">
              <Mail className="size-4 shrink-0" aria-hidden />
              {profile.email}
            </span>
            <span
              aria-hidden
              className="hidden h-1 w-1 rounded-full bg-border sm:inline-block"
            />
            <ResidencyBadge status={profile.residency} />
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle>Personal information</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`${base}/edit`}>
                  <Pencil />
                  Edit
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <InfoRow label="Full name" value={displayName} />
                <InfoRow
                  label="Date of birth"
                  value={
                    profile.birthDate
                      ? formatFullDate(profile.birthDate)
                      : "Not set"
                  }
                />
                <InfoRow
                  label="Mobile number"
                  value={formatMobile(profile.mobileNumber)}
                />
                <InfoRow
                  label="Purok"
                  value={profile.purok ? PUROK_LABELS[profile.purok] : "Not set"}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="flex items-center gap-2">
                <IdCard className="size-5 text-muted-foreground" aria-hidden />
                Government ID
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`${base}/id`}>
                  <Pencil />
                  Change ID
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {profile.id ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <IdPreview
                    front={profile.id.frontImage}
                    back={profile.id.backImage}
                    label={ID_TYPE_LABELS[profile.id.type]}
                    number={profile.id.number}
                  />
                  <dl className="min-w-0 flex-1 divide-y divide-border">
                    <InfoRow
                      label="ID type"
                      value={ID_TYPE_LABELS[profile.id.type]}
                    />
                    <InfoRow label="ID number" value={profile.id.number} mono />
                    <div className="flex items-center justify-between gap-3 py-3">
                      <dt className="text-sm text-muted-foreground">Status</dt>
                      <dd>
                        <IdStatusBadge status={profile.id.status} />
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="py-2 text-sm text-muted-foreground text-pretty">
                  No government ID on file yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sign-in &amp; security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="divide-y divide-border">
                <InfoRow
                  label="Sign-in method"
                  value={
                    profile.signIn.hasPassword
                      ? "Email and password"
                      : profile.signIn.hasGoogle
                        ? "Google"
                        : "Email"
                  }
                />
              </dl>
              {profile.signIn.hasPassword ? (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`${base}/password`}>
                    <KeyRound />
                    Change password
                  </Link>
                </Button>
              ) : (
                <p className="flex items-start gap-2 text-xs text-muted-foreground text-pretty">
                  <KeyRound className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  You sign in with Google, so there&apos;s no password to change
                  here. Manage it in your Google account.
                </p>
              )}
            </CardContent>
          </Card>

          <VerificationCard status={profile.residency} changeIdHref={`${base}/id`} />
        </aside>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-3">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "min-w-0 text-right font-mono text-sm font-medium text-foreground"
            : "min-w-0 text-right text-sm font-medium text-foreground text-pretty"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function ResidencyBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
        <ShieldCheck className="size-4" aria-hidden />
        Verified resident
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
        <ShieldAlert className="size-4" aria-hidden />
        Verification needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-accent-foreground">
      <ShieldQuestion className="size-4" aria-hidden />
      Verification pending
    </span>
  );
}

function IdStatusBadge({ status }: { status: IDStatus }) {
  if (status === IDStatus.APPROVED) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <ShieldCheck className="size-3.5" aria-hidden />
        Verified
      </span>
    );
  }
  if (status === IDStatus.REJECTED) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <ShieldAlert className="size-3.5" aria-hidden />
        Needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
      <ShieldQuestion className="size-3.5" aria-hidden />
      Under review
    </span>
  );
}

function VerificationCard({
  status,
  changeIdHref,
}: {
  status: "pending" | "approved" | "rejected";
  changeIdHref: string;
}) {
  const copy = {
    approved: {
      title: "You're verified",
      body: "An official confirmed your ID. You can request documents anytime.",
    },
    pending: {
      title: "Under review",
      body: "An official is checking the ID on file. You'll be able to request documents once it's approved.",
    },
    rejected: {
      title: "ID needs attention",
      body: "Your ID couldn't be verified. Replace it with a clear photo of a valid government ID to try again.",
    },
  }[status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{copy.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-pretty">{copy.body}</p>
        {status === "rejected" && (
          <Button asChild className="w-full">
            <Link href={changeIdHref}>Replace ID</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
