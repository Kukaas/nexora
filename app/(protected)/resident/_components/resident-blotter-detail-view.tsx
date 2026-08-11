"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Gavel,
  MapPin,
  Paperclip,
  Phone,
  Shield,
  User,
  UserX,
} from "lucide-react";
import type { BlotterRecordDTO, BlotterStatus, IncidentType } from "@/lib/blotter-data";
import { Button } from "@/components/ui/button";

const INCIDENT_TYPE_MAP: Record<IncidentType, { label: string; description: string }> = {
  NEIGHBOR_DISPUTE: {
    label: "Neighbor Dispute / Boundary Argument",
    description: "Disputes over boundaries, noise, pets, or property lines.",
  },
  NOISE_COMPLAINT: {
    label: "Excessive Noise Complaint",
    description: "Loud sound, late night disturbances, or party noise.",
  },
  PHYSICAL_INJURY: {
    label: "Physical Assault / Injury",
    description: "Physical altercations or injuries resulting from a dispute.",
  },
  PROPERTY_DAMAGE: {
    label: "Property Damage / Vandalism",
    description: "Damage to private or shared barangay property.",
  },
  THEFT: {
    label: "Theft / Burglary",
    description: "Stolen personal belongings, livestock, or property.",
  },
  THREATS: {
    label: "Verbal Threats / Harassment",
    description: "Threats of violence, grave threats, or persistent harassment.",
  },
  DOMESTIC: {
    label: "Domestic / Family Incident",
    description: "Disputes or conflicts within a household or family.",
  },
  OTHER: {
    label: "Other Community Incident",
    description: "Any other community incident requiring official blotter documentation.",
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

function StatusBadge({ status }: { status: BlotterStatus }) {
  switch (status) {
    case "FILED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <Clock className="size-3.5" aria-hidden />
          Filed · Under Review
        </span>
      );
    case "MEDIATION_SCHEDULED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
          <Calendar className="size-3.5" aria-hidden />
          Lupon Conciliation Scheduled
        </span>
      );
    case "SETTLED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Amicably Settled
        </span>
      );
    case "DISMISSED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          Case Dismissed
        </span>
      );
    case "ESCALATED_TO_PNP":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
          <AlertCircle className="size-3.5" aria-hidden />
          Escalated to PNP / Court Action
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

export function ResidentBlotterDetailView({
  record,
  residentId,
}: {
  record: BlotterRecordDTO;
  residentId: string;
}) {
  const isEditable = record.status === "FILED";
  const typeInfo = INCIDENT_TYPE_MAP[record.incidentType] || {
    label: record.incidentType.replace(/_/g, " "),
    description: "Barangay blotter incident.",
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Back Navigation */}
      <Link
        href={`/resident/${residentId}/blotter`}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to blotter records
      </Link>

      {/* Header Bar */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-primary">
              {record.caseNumber}
            </span>
            <StatusBadge status={record.status} />
            {record.isConfidential && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300">
                <Shield className="size-3" />
                Confidential
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground">
            {typeInfo.label}
          </h1>
          <p className="text-sm text-muted-foreground">
            Filed on {formatDate(record.createdAt)}
          </p>
        </div>

        {isEditable && (
          <Button asChild className="rounded-full h-10 px-6 font-semibold shadow-xs">
            <Link href={`/resident/${residentId}/blotter/${record.id}/edit`}>
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
          {/* Respondent & Parties Involved Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <UserX className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Parties & Respondent Details
                </h2>
                <p className="text-xs text-muted-foreground">
                  Complainant and reported respondent information.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1 rounded-3xl border border-border bg-muted/20 p-4">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Complainant</span>
                <span className="font-semibold text-sm text-foreground">{record.complainantName}</span>
                {record.complainantContact && (
                  <span className="text-xs text-muted-foreground font-mono mt-0.5">Contact: {record.complainantContact}</span>
                )}
              </div>

              <div className="flex flex-col gap-1 rounded-3xl border border-border bg-muted/20 p-4">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Respondent</span>
                <span className="font-semibold text-sm text-foreground">{record.respondentName}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{record.respondentAddress || "No address provided"}</span>
              </div>
            </div>
          </section>

          {/* Statement Narrative & Details Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <FileText className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Case Narrative & Allegations
                </h2>
                <p className="text-xs text-muted-foreground">
                  Chronological account of events filed by complainant.
                </p>
              </div>
            </div>

            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/20 p-5 rounded-3xl border border-border/50">
              {record.narrative}
            </div>
          </section>

          {/* Conciliation & Lupon Schedule Notes */}
          {record.hearingDate && (
            <section className="flex flex-col gap-4 rounded-4xl border border-sky-500/30 bg-sky-500/10 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 text-sky-900 dark:text-sky-200">
                <Gavel className="size-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <h2 className="font-semibold text-base">Lupon Conciliation Hearing Schedule</h2>
              </div>
              <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed font-medium pl-7">
                Official Hearing Date: {formatDate(record.hearingDate)} at Barangay Libtangin Hall.
              </p>
            </section>
          )}

          {record.resolutionNotes && (
            <section className="flex flex-col gap-4 rounded-4xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-sm">
              <div className="flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h2 className="font-semibold text-base">Resolution & Settlement Agreement</h2>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed whitespace-pre-wrap pl-7">
                {record.resolutionNotes}
              </p>
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
                  Case Parameters
                </h2>
                <p className="text-xs text-muted-foreground">
                  Incident location and officers.
                </p>
              </div>
            </div>

            <dl className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <dt className="font-medium text-muted-foreground">Incident Type</dt>
                <dd className="font-semibold text-foreground">{typeInfo.label}</dd>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <dt className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" /> Date of Occurrence
                </dt>
                <dd className="font-medium text-foreground">{formatDate(record.incidentDate)}</dd>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <dt className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-muted-foreground" /> Location / Area
                </dt>
                <dd className="font-medium text-foreground">{record.incidentLocation}</dd>
              </div>

              {record.officerInChargeName && (
                <div className="flex flex-col gap-1 border-t border-border pt-3">
                  <dt className="font-medium text-muted-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-muted-foreground" /> Officer / Lupon Assigned
                  </dt>
                  <dd className="font-medium text-foreground">{record.officerInChargeName}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Evidence Attachment Card */}
          {record.attachmentUrl && (
            <section className="flex flex-col gap-4 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Paperclip className="size-4 text-primary" />
                <span>Proof & Evidence Attachment</span>
              </div>

              {isImageUrl(record.attachmentUrl) ? (
                <div className="flex flex-col gap-3">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-muted/30 p-2">
                    <img
                      src={record.attachmentUrl}
                      alt="Attached Evidence"
                      className="w-full h-auto max-h-[30rem] object-contain rounded-2xl transition-transform hover:scale-[1.01]"
                    />
                  </div>
                  <a
                    href={record.attachmentUrl}
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
                  href={record.attachmentUrl}
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
