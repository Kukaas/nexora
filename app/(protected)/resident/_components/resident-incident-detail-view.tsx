"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  MapPin,
  Paperclip,
  Phone,
  Shield,
  ShieldAlert,
} from "lucide-react";
import type { IncidentReportDTO, IncidentStatus } from "@/lib/incidents-data";
import { Button } from "@/components/ui/button";

const CATEGORY_MAP: Record<string, { label: string; description: string }> = {
  NOISE_DISTURBANCE: {
    label: "Excessive Noise Disturbance",
    description: "Loud sound, late night disturbances, or party noise.",
  },
  PUBLIC_SAFETY: {
    label: "Public Safety & Hazard",
    description: "Fallen trees, dangerous electrical wires, dark streets, or road obstructions.",
  },
  SANITATION_ENVIRONMENT: {
    label: "Sanitation & Environmental Issue",
    description: "Illegal dumping, uncollected garbage, or drainage overflow.",
  },
  STRAY_ANIMALS: {
    label: "Stray Animals & Pet Disturbance",
    description: "Aggressive animals, uncontrolled pets, or animal waste issues.",
  },
  NEIGHBORHOOD_DISPUTE: {
    label: "Minor Neighborhood Dispute",
    description: "Parking disputes, property boundary complaints, or minor disagreements.",
  },
  OTHER: {
    label: "General Community Incident",
    description: "Any other community issue requiring barangay attention or assistance.",
  },
};

function isImageUrl(url: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.includes(".svg") ||
    lower.includes("/image/upload/") ||
    lower.includes("cloudinary.com")
  );
}

function StatusBadge({ status }: { status: IncidentStatus }) {
  switch (status) {
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Clock className="size-3.5" aria-hidden />
          Submitted · Pending Review
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          <Shield className="size-3.5" aria-hidden />
          Under Review by Officials
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
          <Activity className="size-3.5 animate-pulse" aria-hidden />
          Action In Progress
        </span>
      );
    case "RESOLVED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Resolved
        </span>
      );
    case "CONVERTED_TO_BLOTTER":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
          <ShieldAlert className="size-3.5" aria-hidden />
          Elevated to Blotter Case
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {status}
        </span>
      );
  }
}

function formatDate(isoStr: string) {
  try {
    return new Intl.DateTimeFormat("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(isoStr));
  } catch {
    return isoStr;
  }
}

export function ResidentIncidentDetailView({
  incident,
  residentId,
}: {
  incident: IncidentReportDTO;
  residentId: string;
}) {
  const isEditable = incident.status === "SUBMITTED";
  const categoryInfo = CATEGORY_MAP[incident.category] || {
    label: incident.category.replace(/_/g, " "),
    description: "Community incident report.",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Back Navigation */}
      <Link
        href={`/resident/${residentId}/incidents`}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to incident reports
      </Link>

      {/* Header Bar */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">
              {incident.reportNumber}
            </span>
            <StatusBadge status={incident.status} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
            {incident.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Reported on {formatDate(incident.createdAt)}
          </p>
        </div>

        {isEditable && (
          <Button asChild className="rounded-full h-10 px-6 font-semibold shadow-xs">
            <Link href={`/resident/${residentId}/incidents/${incident.id}/edit`}>
              <Edit3 className="mr-1.5 size-4" />
              Edit Report
            </Link>
          </Button>
        )}
      </header>

      {/* 2-Column Responsive Layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Main Left Column */}
        <div className="flex flex-col gap-6">
          {/* Narrative Details Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <FileText className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Incident Narrative & Description
                </h2>
                <p className="text-xs text-muted-foreground">
                  Full details reported by the resident.
                </p>
              </div>
            </div>

            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-5 rounded-3xl border border-border/50">
              {incident.description}
            </div>
          </section>

          {/* Official Response Notes Card (if available) */}
          {incident.adminNotes ? (
            <section className="flex flex-col gap-4 rounded-4xl border border-sky-500/30 bg-sky-500/10 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 text-sky-900 dark:text-sky-200">
                <CheckCircle2 className="size-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <h2 className="font-semibold text-base">Barangay Official Response & Remarks</h2>
              </div>
              <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed whitespace-pre-wrap pl-7">
                {incident.adminNotes}
              </p>
            </section>
          ) : (
            <section className="flex items-center gap-3 rounded-4xl border border-border bg-card/60 p-5 text-xs text-muted-foreground">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <span>No official remarks attached yet. Barangay officials will update this report upon review.</span>
            </section>
          )}
        </div>

        {/* Right Sidebar Metadata Column */}
        <div className="flex flex-col gap-6">
          {/* Incident Metadata Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <MapPin className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Incident Information
                </h2>
                <p className="text-xs text-muted-foreground">
                  Classification, time, and location.
                </p>
              </div>
            </div>

            <dl className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <dt className="font-medium text-muted-foreground">Classification</dt>
                <dd className="font-semibold text-foreground">{categoryInfo.label}</dd>
                <dd className="text-[11px] text-muted-foreground">{categoryInfo.description}</dd>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <dt className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" /> Date of Occurrence
                </dt>
                <dd className="font-medium text-foreground">{formatDate(incident.incidentDate)}</dd>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <dt className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" /> Location / Area
                </dt>
                <dd className="font-medium text-foreground">{incident.location}</dd>
              </div>

              {incident.reporterContact && (
                <div className="flex flex-col gap-1 border-t border-border pt-3">
                  <dt className="font-medium text-muted-foreground flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" /> Contact Phone Number
                  </dt>
                  <dd className="font-mono text-foreground font-medium">{incident.reporterContact}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Evidence Attachment Card */}
          {incident.attachmentUrl && (
            <section className="flex flex-col gap-4 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Paperclip className="size-4 text-primary" />
                <span>Proof & Evidence Attachment</span>
              </div>

              {isImageUrl(incident.attachmentUrl) ? (
                <div className="flex flex-col gap-3">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-muted/30 p-2">
                    <img
                      src={incident.attachmentUrl}
                      alt="Attached Evidence"
                      className="w-full h-auto max-h-[30rem] object-contain rounded-2xl transition-transform hover:scale-[1.01]"
                    />
                  </div>
                  <a
                    href={incident.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <span>Open Full Resolution Image</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                </div>
              ) : (
                <a
                  href={incident.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-3xl border border-primary/30 bg-primary/5 p-4 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <span>View Attached Evidence Document</span>
                  <ExternalLink className="size-4 shrink-0" />
                </a>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
