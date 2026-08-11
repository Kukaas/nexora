"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Loader2,
  MapPin,
  Paperclip,
  Phone,
  Shield,
  ShieldAlert,
  UploadCloud,
  User,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateResidentBlotterRecord, uploadBlotterProofAttachment } from "@/lib/blotter-actions";
import type { BlotterRecordDTO, IncidentType } from "@/lib/blotter-data";

const INCIDENT_TYPES: { value: IncidentType; label: string; description: string }[] = [
  { value: "NEIGHBOR_DISPUTE", label: "Neighbor Dispute / Argument", description: "Disputes over boundaries, noise, pets, or property lines." },
  { value: "NOISE_COMPLAINT", label: "Excessive Noise Complaint", description: "Loud sound, late-night disturbances, or party noise." },
  { value: "PHYSICAL_INJURY", label: "Physical Assault / Injury", description: "Physical altercations or injuries resulting from a dispute." },
  { value: "PROPERTY_DAMAGE", label: "Property Damage / Vandalism", description: "Damage to private or shared barangay property." },
  { value: "THEFT", label: "Theft / Burglary", description: "Stolen personal belongings, livestock, or property." },
  { value: "THREATS", label: "Verbal Threats / Harassment", description: "Threats of violence, grave threats, or persistent harassment." },
  { value: "DOMESTIC", label: "Domestic / Family Incident", description: "Disputes or conflicts within a household or family." },
  { value: "OTHER", label: "Other Incident", description: "Any other community incident requiring official blotter documentation." },
];

export function ResidentBlotterEditForm({
  record,
  residentId,
}: {
  record: BlotterRecordDTO;
  residentId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [incidentType, setIncidentType] = useState<IncidentType>(record.incidentType);
  const [incidentLocation, setIncidentLocation] = useState(record.incidentLocation);
  const [respondentName, setRespondentName] = useState(record.respondentName);
  const [respondentAddress, setRespondentAddress] = useState(record.respondentAddress ?? "");
  const [contactDigits, setContactDigits] = useState(() => {
    const dc = record.complainantContact ?? "";
    return dc.replace(/^0/, "").slice(0, 10);
  });
  const [narrative, setNarrative] = useState(record.narrative);
  const [isConfidential, setIsConfidential] = useState(record.isConfidential);

  // Initial date parsing
  const initialDateObj = useMemo(() => {
    try {
      return new Date(record.incidentDate);
    } catch {
      return new Date();
    }
  }, [record.incidentDate]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDateObj);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [hour12, setHour12] = useState<string>(() => {
    const h = initialDateObj.getHours();
    const h12 = h % 12 || 12;
    return String(h12).padStart(2, "0");
  });
  const [minute, setMinute] = useState<string>(() => {
    const m = Math.floor(initialDateObj.getMinutes() / 5) * 5;
    return String(m).padStart(2, "0");
  });
  const [ampm, setAmPm] = useState<"AM" | "PM">(
    initialDateObj.getHours() >= 12 ? "PM" : "AM"
  );

  const [uploadingProof, setUploadingProof] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(
    record.attachmentUrl ?? null
  );
  const [attachmentName, setAttachmentName] = useState<string | null>(
    record.attachmentUrl ? "Attached Evidence Document" : null
  );
  const [attachmentSize, setAttachmentSize] = useState<number | null>(null);

  const incidentDate = useMemo(() => {
    const dateObj = selectedDate || new Date();
    let h24 = parseInt(hour12, 10);
    if (ampm === "PM" && h24 < 12) h24 += 12;
    if (ampm === "AM" && h24 === 12) h24 = 0;
    const hStr = String(h24).padStart(2, "0");
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}T${hStr}:${minute}`;
  }, [selectedDate, hour12, minute, ampm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError("File size exceeds 15 MB limit.");
      return;
    }

    setUploadingProof(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await uploadBlotterProofAttachment(formData);
      if (res.ok) {
        setAttachmentUrl(res.url);
        setAttachmentName(res.name);
        setAttachmentSize(res.size);
        toast.success("Proof attachment updated successfully.");
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to upload proof file.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentLocation.trim()) {
      setError("Please provide the location where the incident occurred.");
      return;
    }
    if (!respondentName.trim()) {
      setError("Please provide the name or identity of the person involved (respondent).");
      return;
    }
    if (!narrative.trim() || narrative.trim().length < 20) {
      setError("Please provide a detailed description (at least 20 characters) explaining what happened.");
      return;
    }
    if (contactDigits.trim() && contactDigits.trim().length !== 10) {
      setError("Please enter all 10 digits after +63 (e.g. 9123456789).");
      return;
    }

    setSubmitting(true);
    setError(null);

    const complainantContact = contactDigits.trim() ? `0${contactDigits.trim()}` : null;

    try {
      await updateResidentBlotterRecord(record.id, {
        incidentType,
        incidentDate,
        incidentLocation: incidentLocation.trim(),
        respondentName: respondentName.trim(),
        respondentAddress: respondentAddress.trim() || null,
        complainantContact,
        narrative: narrative.trim(),
        isConfidential,
        attachmentUrl: attachmentUrl || null,
      });

      toast.success(`Blotter record #${record.caseNumber} updated successfully.`);
      router.push(`/resident/${residentId}/blotter/${record.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to update record. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Error Alert Box */}
      {error && (
        <div className="flex items-start gap-3.5 rounded-3xl border border-destructive/30 bg-destructive/10 p-4.5 text-sm text-destructive shadow-xs">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex-1">
            <h4 className="font-semibold">Unable to update blotter record</h4>
            <p className="mt-0.5 text-xs text-destructive/90">{error}</p>
          </div>
        </div>
      )}

      {/* Categorized Multi-Column Section Grid */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Left / Main Column */}
        <div className="flex flex-col gap-6">
          {/* Section 1: Incident Type Classification Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <ShieldAlert className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  1. Incident Type & Classification
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select the category that best describes the incident you are reporting.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {INCIDENT_TYPES.map((t) => {
                const isSelected = incidentType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setIncidentType(t.value)}
                    className={cn(
                      "flex flex-col gap-1.5 text-left rounded-3xl border p-4 outline-none transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-background hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>{t.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="size-4 text-primary shrink-0" aria-hidden />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Respondent Information Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <UserX className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  2. Respondent / Person Involved
                </h2>
                <p className="text-xs text-muted-foreground">
                  Provide details of the individual being reported to officials.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="respondentName"
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <User className="size-3.5 text-muted-foreground" aria-hidden />
                  Respondent Full Name / Alias <span className="text-destructive">*</span>
                </label>
                <Input
                  id="respondentName"
                  type="text"
                  required
                  placeholder="e.g. Juan Dela Cruz (or Alias 'Jun')"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  className="h-10 rounded-2xl text-xs bg-background border-border"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="respondentAddress"
                  className="text-xs font-semibold text-foreground"
                >
                  Respondent Address / Purok <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <Input
                  id="respondentAddress"
                  type="text"
                  placeholder="e.g. Purok 2, Libtangin"
                  value={respondentAddress}
                  onChange={(e) => setRespondentAddress(e.target.value)}
                  className="h-10 rounded-2xl text-xs bg-background border-border"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="complainantContact"
                className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
              >
                <Phone className="size-3.5 text-muted-foreground" aria-hidden />
                Your Best Contact Number <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
              </label>
              <div className="flex h-10 w-full overflow-hidden rounded-2xl border border-border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                <span className="flex items-center justify-center bg-muted/60 px-3.5 font-mono font-bold text-xs text-primary border-e border-border shrink-0 select-none">
                  +63
                </span>
                <input
                  id="complainantContact"
                  type="tel"
                  maxLength={10}
                  placeholder="9123456789"
                  value={contactDigits}
                  onChange={(e) => setContactDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1 bg-transparent px-3 text-xs font-mono text-foreground outline-none border-none placeholder:text-muted-foreground"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                The prefix <span className="font-mono font-semibold text-primary">+63</span> is fixed. Enter the remaining 10 digits.
              </p>
            </div>
          </section>

          {/* Section 3: Detailed Incident Narrative Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <FileText className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  3. Statement Narrative & Confidentiality
                </h2>
                <p className="text-xs text-muted-foreground">
                  Describe clearly what happened, including any witnesses or actions taken.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="narrative"
                  className="text-xs font-semibold text-foreground"
                >
                  Incident Narrative & Details <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="narrative"
                  required
                  rows={6}
                  placeholder="Describe the incident chronologically. Include date, time, actions taken, and names of any witnesses present..."
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  className="rounded-3xl text-xs bg-background border-border p-4"
                />
                <p className="text-[11px] text-muted-foreground">
                  Minimum 20 characters. Factual and accurate details help officials review your case quickly.
                </p>
              </div>

              <label className="flex items-start gap-3 rounded-3xl border border-border bg-muted/20 p-4 cursor-pointer hover:bg-muted/40 transition-colors">
                <input
                  type="checkbox"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border accent-primary cursor-pointer"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <Shield className="size-4 text-primary" aria-hidden />
                    Mark Case as Confidential Incident
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-normal">
                    Restricts case visibility strictly to authorized Barangay Officials (Lupon Chairman, Captain, and Secretary) only.
                  </span>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right / Side Column */}
        <div className="flex flex-col gap-6">
          {/* Section 4: Date, Time & Location Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <MapPin className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  4. Time & Location
                </h2>
                <p className="text-xs text-muted-foreground">
                  Specify when and where the incident occurred.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <CalendarIcon className="size-3.5 text-primary" aria-hidden />
                  Date & Time of Incident <span className="text-destructive">*</span>
                </label>

                {/* Popover Date Picker Trigger - Full Width */}
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-10 w-full items-center justify-between gap-2 rounded-2xl border border-border bg-background px-3.5 text-xs font-medium text-foreground hover:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {selectedDate
                            ? selectedDate.toLocaleDateString("en-PH", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Select Date"}
                        </span>
                      </span>
                      <Badge variant="secondary" className="rounded-xl text-[10px] font-mono shrink-0">
                        Calendar
                      </Badge>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0 rounded-4xl">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        if (d) setSelectedDate(d);
                        setDatePopoverOpen(false);
                      }}
                      disabled={{ after: new Date() }}
                    />
                  </PopoverContent>
                </Popover>

                {/* Time Selectors Controls Row */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 min-w-0 items-center justify-between rounded-2xl border border-border bg-background px-2 py-1">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3.5 ml-1 text-muted-foreground shrink-0" aria-hidden />
                      
                      {/* Hour Select */}
                      <Select value={hour12} onValueChange={setHour12}>
                        <SelectTrigger className="h-7 w-[48px] border-none text-xs font-mono font-semibold focus:ring-0 shadow-none px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const val = String(i + 1).padStart(2, "0");
                            return (
                              <SelectItem key={val} value={val} className="text-xs font-mono">
                                {val}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      <span className="text-xs font-bold text-muted-foreground font-mono">:</span>

                      {/* Minute Select */}
                      <Select value={minute} onValueChange={setMinute}>
                        <SelectTrigger className="h-7 w-[48px] border-none text-xs font-mono font-semibold focus:ring-0 shadow-none px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                            (m) => (
                              <SelectItem key={m} value={m} className="text-xs font-mono">
                                {m}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <span className="text-[11px] text-muted-foreground font-medium pr-1 hidden sm:inline">Time</span>
                  </div>

                  {/* AM / PM Toggle Pills */}
                  <div className="inline-flex h-9 items-center rounded-2xl bg-muted p-1 border border-border/40 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAmPm("AM")}
                      className={cn(
                        "h-7 rounded-xl px-2.5 text-xs font-bold font-mono transition-colors cursor-pointer",
                        ampm === "AM"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmPm("PM")}
                      className={cn(
                        "h-7 rounded-xl px-2.5 text-xs font-bold font-mono transition-colors cursor-pointer",
                        ampm === "PM"
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="incidentLocation"
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                  Incident Location / Area <span className="text-destructive">*</span>
                </label>
                <Input
                  id="incidentLocation"
                  type="text"
                  required
                  placeholder="e.g. Purok 3 near Chapel, Main Road"
                  value={incidentLocation}
                  onChange={(e) => setIncidentLocation(e.target.value)}
                  className="h-10 rounded-2xl text-xs bg-background border-border"
                />
              </div>
            </div>
          </section>

          {/* Section 5: Evidence & Proof Attachment Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <Paperclip className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  5. Proof & Photo Evidence
                </h2>
                <p className="text-xs text-muted-foreground">
                  Attach photos, PDFs, or documents to support your report (Optional).
                </p>
              </div>
            </div>

            {attachmentUrl ? (
              <div className="flex items-center justify-between gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    <FileCheck className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">
                      {attachmentName || "Attached Evidence File"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {attachmentSize
                        ? `${(attachmentSize / 1024 / 1024).toFixed(2)} MB · `
                        : ""}
                      Evidence File Attached & Ready
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentUrl(null);
                    setAttachmentName(null);
                    setAttachmentSize(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-muted/20 p-5 text-center cursor-pointer hover:bg-muted/40 hover:border-primary/50 transition-all">
                <input
                  type="file"
                  accept="image/*,application/pdf,text/plain,.doc,.docx"
                  disabled={uploadingProof}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadingProof ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-primary py-2">
                    <Loader2 className="size-4 animate-spin" />
                    Uploading proof attachment...
                  </div>
                ) : (
                  <>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UploadCloud className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Click or drop file to attach proof (Optional)
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Supports images, PDFs, or TXT up to 15 MB
                      </p>
                    </div>
                  </>
                )}
              </label>
            )}
          </section>
        </div>
      </div>

      {/* Full-Width Bottom Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          asChild
          className="rounded-full h-10 px-6 text-sm font-semibold"
        >
          <Link href={`/resident/${residentId}/blotter/${record.id}`}>
            Cancel
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={submitting}
          className="rounded-full h-10 px-7 text-sm font-semibold shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
              <span>Saving Changes...</span>
            </>
          ) : (
            <span>Save Case Changes</span>
          )}
        </Button>
      </div>
    </form>
  );
}
