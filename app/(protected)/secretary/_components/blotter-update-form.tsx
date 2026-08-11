"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Gavel,
  Loader2,
  Paperclip,
  Save,
  ShieldAlert,
  Users,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateBlotterRecord } from "@/lib/blotter-actions";
import type { BlotterRecordDTO, BlotterStatus } from "@/lib/blotter-data";

export interface BlotterUpdateFormProps {
  record: BlotterRecordDTO;
  basePath: string;
}

const STATUS_OPTIONS: { value: BlotterStatus; label: string; desc: string }[] = [
  { value: "FILED", label: "Filed", desc: "Complaint encoded; pending initial review" },
  { value: "MEDIATION_SCHEDULED", label: "Mediation Scheduled", desc: "Hearing date set for amicable settlement" },
  { value: "SETTLED", label: "Settled", desc: "Resolved amicably between parties" },
  { value: "DISMISSED", label: "Dismissed", desc: "Complaint dropped or dismissed" },
  { value: "ESCALATED_TO_PNP", label: "Escalated to PNP", desc: "Transferred to Philippine National Police" },
];

export function BlotterUpdateForm({ record, basePath }: BlotterUpdateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [status, setStatus] = useState<BlotterStatus>(record.status);
  const [hearingDate, setHearingDate] = useState(
    record.hearingDate ? record.hearingDate.slice(0, 16) : ""
  );
  const [resolutionNotes, setResolutionNotes] = useState(record.resolutionNotes || "");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateBlotterRecord(record.id, {
        status,
        hearingDate: hearingDate ? new Date(hearingDate).toISOString() : null,
        resolutionNotes,
      });

      setSuccess("Blotter case record updated successfully.");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update record.");
    } finally {
      setLoading(false);
    }
  };

  const incidentDateStr = new Date(record.incidentDate).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar */}
      <Link
        href={basePath}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to blotter records
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance font-mono">
              {record.caseNumber}
            </h1>
            <Badge variant="outline" className="rounded-full">
              {record.status.replace("_", " ")}
            </Badge>
            {record.isConfidential && (
              <Badge variant="destructive" className="rounded-full text-xs font-normal">
                Confidential Case
              </Badge>
            )}
          </div>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            Incident Date: {incidentDateStr} · Location: {record.incidentLocation}
          </p>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          <ShieldAlert className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleUpdate} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] items-start gap-6">
          {/* Left Column: Read-only Case Details */}
          <div className="flex flex-col gap-6">
            {/* Parties involved */}
            <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Users className="size-4.5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    1. Parties Involved
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Complainant and respondent party profiles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Complainant</span>
                  <p className="font-semibold text-base text-foreground">{record.complainantName}</p>
                  {record.complainantContact && (
                    <p className="text-xs text-muted-foreground">Contact: {record.complainantContact}</p>
                  )}
                  {record.complainantEmail && (
                    <p className="text-xs text-muted-foreground">Email: {record.complainantEmail}</p>
                  )}
                </div>

                <div className="p-4 rounded-3xl border border-border bg-muted/20 space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">Respondent</span>
                  <p className="font-semibold text-base text-foreground">{record.respondentName}</p>
                  {record.respondentAddress && (
                    <p className="text-xs text-muted-foreground">Address: {record.respondentAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Incident Summary */}
            <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <FileText className="size-4.5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    2. Incident Details & Statement
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Incident classification, location, and official narrative.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Incident Type</span>
                  <span className="font-medium">{record.incidentType}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Location</span>
                  <span className="font-medium">{record.incidentLocation}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-medium text-muted-foreground">Official Narrative / Statement</span>
                <div className="p-4 rounded-3xl bg-muted/20 border border-border text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {record.narrative}
                </div>
              </div>

              {record.attachmentUrl && (
                <div className="flex flex-col gap-2 pt-1">
                  <span className="text-xs font-medium text-muted-foreground">Evidence / Proof Attachment</span>
                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-3xl border border-border bg-muted/30 text-xs">
                    <div className="flex items-center gap-2 text-foreground font-medium truncate">
                      <Paperclip className="size-4 shrink-0 text-primary" />
                      <span className="truncate">Complainant Attached Proof File</span>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-2xl gap-1.5 shrink-0">
                      <a href={record.attachmentUrl} target="_blank" rel="noreferrer">
                        <span>View Proof</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Case Management & Resolution Form */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Gavel className="size-4.5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    3. Case Action & Resolution
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Update case status, mediation dates, and hearing minutes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="statusSelect">Case Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v) => setStatus(v as BlotterStatus)}
                  >
                    <SelectTrigger id="statusSelect" className="w-full">
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="hearingDate">Schedule Mediation Hearing Date</Label>
                  <Input
                    id="hearingDate"
                    type="datetime-local"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Required when status is Mediation Scheduled.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="resolutionNotes">Resolution & Minutes Notes</Label>
                  <Textarea
                    id="resolutionNotes"
                    rows={5}
                    placeholder="Enter hearing outcome, amicable agreement terms, or referral notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="min-h-[120px] resize-y"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild disabled={loading} className="rounded-2xl">
            <Link href={basePath}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="rounded-2xl">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Update Blotter Record
          </Button>
        </div>
      </form>
    </div>
  );
}
