import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Inbox, Loader } from "lucide-react";

import { getSession } from "@/lib/session";
import {
  getRecentRequestsByStatus,
  getRequestSummary,
} from "@/lib/secretary-data";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";
import { requestHasPayment, type DocumentRequestDTO } from "@/lib/documents";
import { formatDate, formatPeso, RequestStatusBadge } from "../_components/secretary-ui";

export const metadata: Metadata = {
  title: "Overview · Secretary · Barangay Libtangin",
};

const TZ = "Asia/Manila";

export default async function SecretaryOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, toPrepare, readyToClaim, summary] = await Promise.all([
    getSession(),
    getRecentRequestsByStatus(DocumentRequestStatus.PROCESSING, 6),
    getRecentRequestsByStatus(DocumentRequestStatus.READY, 5),
    getRequestSummary(),
  ]);

  const firstName = firstNameOf(session?.user);
  const requestsHref = `/secretary/${id}/requests`;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">{today()}</p>
      </header>

      <dl className="flex flex-col divide-y divide-border rounded-4xl border border-border bg-card p-1 sm:flex-row sm:divide-x sm:divide-y-0">
        <Stat label="Awaiting payment" value={summary.pendingCount} />
        <Stat label="To prepare" value={summary.processingCount} accent />
        <Stat label="Ready to claim" value={summary.readyCount} />
      </dl>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Primary queue: documents the secretary can prepare now. */}
        <Panel
          className="lg:col-span-2"
          icon={<Loader className="size-4 text-sky-600" aria-hidden />}
          title="Ready to prepare"
          caption="Payment verified by the treasurer. Prepare these, then mark them ready."
          action={
            summary.processingCount > 0
              ? { href: requestsHref, label: "View all requests" }
              : undefined
          }
        >
          {toPrepare.length === 0 ? (
            <PanelEmpty
              title="Nothing to prepare"
              description="When the treasurer verifies a payment, the request shows up here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {toPrepare.map((r) => (
                <QueueRow key={r.id} request={r} basePath={requestsHref} />
              ))}
            </ul>
          )}
        </Panel>

        {/* Secondary: prepared documents waiting for pickup. */}
        <Panel
          icon={<CheckCircle2 className="size-4 text-emerald-600" aria-hidden />}
          title="Ready to claim"
          caption="Waiting for residents to pick up at the hall."
          action={
            summary.readyCount > 0
              ? { href: requestsHref, label: "View all" }
              : undefined
          }
        >
          {readyToClaim.length === 0 ? (
            <PanelEmpty
              title="Nothing waiting"
              description="Documents you mark ready will appear here for pickup."
            />
          ) : (
            <ul className="divide-y divide-border">
              {readyToClaim.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${requestsHref}/${r.id}`}
                    className="flex flex-col gap-0.5 px-5 py-3.5 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
                  >
                    <span className="truncate text-sm font-medium">
                      {r.documentName}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {r.requesterName}
                    </span>
                    {r.releasedAt && (
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        Ready since {formatDate(r.releasedAt)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function QueueRow({
  request: r,
  basePath,
}: {
  request: DocumentRequestDTO;
  basePath: string;
}) {
  const paid = requestHasPayment(r);
  return (
    <li>
      <Link
        href={`${basePath}/${r.id}`}
        className="flex items-center gap-4 px-5 py-3.5 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/30"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{r.documentName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {r.requesterName}
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {r.referenceNumber}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-mono text-sm font-medium tabular-nums">
            {paid ? formatPeso(r.fee) : "Free"}
          </span>
          <RequestStatusBadge status={r.status} />
        </div>
      </Link>
    </li>
  );
}

function Panel({
  icon,
  title,
  caption,
  action,
  className,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  caption: string;
  action?: { href: string; label: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-4xl border border-border bg-card ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            {icon}
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {caption}
          </p>
        </div>
        {action && (
          <Link
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1 rounded-2xl text-sm font-medium text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">View</span>
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
      <div className="border-t border-border">{children}</div>
    </section>
  );
}

function PanelEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-10 text-center">
      <Inbox className="size-5 text-muted-foreground" aria-hidden />
      <p className="mt-1 text-sm font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground text-pretty">
        {description}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2">
        {accent && <span className="size-2 rounded-full bg-primary" aria-hidden />}
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
      </dd>
    </div>
  );
}

/** Time-of-day greeting in the barangay's local time. */
function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: TZ,
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function today(): string {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  }).format(new Date());
}

function firstNameOf(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const u = user as { firstName?: unknown; name?: unknown };
  if (typeof u.firstName === "string" && u.firstName.trim()) {
    return u.firstName.trim();
  }
  if (typeof u.name === "string" && u.name.trim()) {
    return u.name.trim().split(/\s+/)[0];
  }
  return null;
}
