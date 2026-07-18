import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, IdCard, Megaphone, MessagesSquare } from "lucide-react";

import { getAnalyticsData, getCommunitySummary } from "@/lib/captain-data";
import { getOfficialUnreadCount } from "@/lib/chat-data";
import { CaptainAnalytics } from "../_components/captain-analytics";

export const metadata: Metadata = {
  title: "Analytics · Captain · Barangay Libtangin",
};

export default async function CaptainOverviewPage() {
  const [analytics, community, unreadCount] = await Promise.all([
    getAnalyticsData(),
    getCommunitySummary(),
    getOfficialUnreadCount(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Barangay analytics
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Requests, collections, and the registry at a glance. Filter by date
          or document, then export or print the view.
        </p>
      </header>

      <CaptainAnalytics
        requests={analytics.requests}
        residentJoinDates={analytics.residentJoinDates}
        generatedAt={analytics.generatedAt}
      />

      {/* Standing facts — not scoped to the date filter above. */}
      <section
        aria-label="Barangay today"
        className="grid gap-3 sm:grid-cols-3"
      >
        <Fact
          icon={IdCard}
          label="IDs awaiting verification"
          value={community.pendingIdCount}
        />
        <Fact
          icon={Megaphone}
          label="Published announcements"
          value={community.publishedAnnouncementCount}
        />
        <Link
          href="/messages"
          className="group flex items-center gap-3 rounded-4xl border border-border bg-card px-5 py-4 outline-none transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:ring-3 focus-visible:ring-ring/40 print:hidden"
        >
          <MessagesSquare
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="flex-1 text-sm">Unread resident messages</span>
          <span className="text-lg font-semibold tabular-nums">
            {unreadCount}
          </span>
          <ArrowRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </Link>
      </section>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IdCard;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-4xl border border-border bg-card px-5 py-4">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="flex-1 text-sm">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}
