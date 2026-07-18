import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronRight,
  FileWarning,
  Megaphone,
  MessagesSquare,
  Pin,
  Plus,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

import { getAssignedPurok, getKagawadOverview } from "@/lib/kagawad-data";
import { purokLabel } from "@/lib/purok";
import { CATEGORY_LABELS } from "@/lib/documents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "../../admin/_data";

export const metadata: Metadata = {
  title: "Kagawad · Barangay Libtangin",
};

export default async function KagawadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Scope by the id in the URL so an admin viewing a kagawad's console sees
  // that kagawad's purok, not their own (blank) assignment.
  const purok = await getAssignedPurok(id);

  if (!purok) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-4xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <ShieldAlert className="size-6" aria-hidden />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            No purok assigned yet
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Your account doesn&apos;t have an assigned purok, so you can&apos;t
            post purok announcements yet. Ask the administrator to set one for
            you.
          </p>
        </div>
      </div>
    );
  }

  const overview = await getKagawadOverview(purok);
  const base = `/kagawad/${id}`;
  const label = purokLabel(purok);

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-foreground">{label}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Kagawad dashboard
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground text-pretty">
            Keep {label}&apos;s residents informed and reachable: post notices
            for your purok, know who lives there, and answer their messages.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={`${base}/announcements/new`}>
            <Plus />
            New announcement
          </Link>
        </Button>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<UsersRound className="size-5" aria-hidden />}
          label={`Residents in ${label}`}
          value={overview.residentCount}
          href={`${base}/residents`}
        />
        <StatCard
          icon={<Megaphone className="size-5" aria-hidden />}
          label="Published notices"
          value={overview.publishedCount}
          href={`${base}/announcements`}
        />
        <StatCard
          icon={<FileWarning className="size-5" aria-hidden />}
          label="Drafts"
          value={overview.draftCount}
          href={`${base}/announcements`}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Recent purok notices */}
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Recent {label} announcements</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={`${base}/announcements`}>
                View all
                <ChevronRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {overview.recent.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                Nothing posted for {label} yet. Your first notice reaches every
                resident of your purok.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {overview.recent.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`${base}/announcements/${a.id}/edit`}
                      className="group flex items-center gap-3 rounded-2xl px-2 py-3 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {a.pinned && (
                            <Pin
                              className="size-3.5 shrink-0 text-accent-foreground"
                              aria-label="Pinned"
                            />
                          )}
                          <span className="truncate font-medium">{a.title}</span>
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          <span>{CATEGORY_LABELS[a.category]}</span>
                          <span aria-hidden>·</span>
                          <span>{formatDate(a.createdAt)}</span>
                          {!a.published && (
                            <>
                              <span aria-hidden>·</span>
                              <span className="font-medium">Draft</span>
                            </>
                          )}
                        </p>
                      </div>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <QuickAction
              href={`${base}/announcements/new`}
              icon={<Plus className="size-4" aria-hidden />}
              title="Post a purok notice"
              blurb={`Goes to ${label} residents' feeds.`}
            />
            <QuickAction
              href={`${base}/residents`}
              icon={<UsersRound className="size-4" aria-hidden />}
              title="View purok residents"
              blurb="Who lives in your purok, with contact details."
            />
            <QuickAction
              href="/messages"
              icon={<MessagesSquare className="size-4" aria-hidden />}
              title="Answer messages"
              blurb="The barangay message desk, shared by officials."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-4xl border border-border bg-card p-5 outline-none transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {label}
        </span>
      </span>
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  title,
  blurb,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  blurb: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-3xl border border-border px-4 py-3 outline-none transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{blurb}</span>
      </span>
    </Link>
  );
}
