"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MapPin,
  Paperclip,
  Phone,
  Shield,
  Sparkles,
  UploadCloud,
  User,
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
import { createResidentIncident, uploadIncidentAttachment } from "@/lib/incidents-actions";

const CATEGORIES = [
  {
    value: "NOISE_DISTURBANCE",
    label: "Excessive Noise Disturbance",
    description: "Loud sound, late night disturbances, or party noise.",
  },
  {
    value: "PUBLIC_SAFETY",
    label: "Public Safety & Hazard",
    description: "Fallen trees, dangerous electrical wires, dark streets, or road obstructions.",
  },
  {
    value: "SANITATION_ENVIRONMENT",
    label: "Sanitation & Environmental Issue",
    description: "Illegal dumping, uncollected garbage, or drainage overflow.",
  },
  {
    value: "STRAY_ANIMALS",
    label: "Stray Animals & Pet Disturbance",
    description: "Aggressive animals, uncontrolled pets, or animal waste issues.",
  },
  {
    value: "NEIGHBORHOOD_DISPUTE",
    label: "Minor Neighborhood Dispute",
    description: "Parking disputes, property boundary complaints, or minor disagreements.",
  },
  {
    value: "OTHER",
    label: "General Community Incident",
    description: "Any other community issue requiring barangay attention or assistance.",
  },
];

export function ResidentIncidentForm({
  residentId,
  reporterName,
  defaultContact,
  defaultPurok,
  verified = true,
}: {
  residentId: string;
  reporterName?: string;
  defaultContact?: string;
  defaultPurok?: string;
  verified?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("NOISE_DISTURBANCE");
  const [location, setLocation] = useState(defaultPurok ?? "");
  const [description, setDescription] = useState("");
  const [contactDigits, setContactDigits] = useState(() => {
    if (!defaultContact) return "";
    return defaultContact.replace(/^0/, "").replace(/^\+63/, "").slice(0, 10);
  });

  // Pre-fill helpers: detect when phone/location match profile values
  const profileDigits = useMemo(
    () => (defaultContact ? defaultContact.replace(/^0/, "").replace(/^\+63/, "").slice(0, 10) : ""),
    [defaultContact],
  );
  const isPhonePrefilled = contactDigits === profileDigits && profileDigits.length > 0;
  const restoreProfilePhone = useCallback(
    () => setContactDigits(profileDigits),
    [profileDigits],
  );

  const isLocationPrefilled = location === defaultPurok && !!defaultPurok;
  const restoreDefaultPurok = useCallback(() => {
    if (defaultPurok) setLocation(defaultPurok);
  }, [defaultPurok]);

  // Redesigned Custom Date & Time State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [hour12, setHour12] = useState<string>(() => {
    const h = new Date().getHours();
    const h12 = h % 12 || 12;
    return String(h12).padStart(2, "0");
  });
  const [minute, setMinute] = useState<string>(() => {
    const m = Math.floor(new Date().getMinutes() / 5) * 5;
    return String(m).padStart(2, "0");
  });
  const [ampm, setAmPm] = useState<"AM" | "PM">(
    new Date().getHours() >= 12 ? "PM" : "AM"
  );

  const [uploadingProof, setUploadingProof] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<number | null>(null);

  // Synchronized incidentDate in ISO YYYY-MM-DDTHH:mm format
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
      const res = await uploadIncidentAttachment(formData);
      if (res.ok) {
        setAttachmentUrl(res.url);
        setAttachmentName(res.name);
        setAttachmentSize(res.size);
        toast.success("Attachment uploaded successfully.");
      } else {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to upload file.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a short title for the incident.");
      return;
    }
    if (!location.trim()) {
      setError("Please specify the location of the incident.");
      return;
    }
    if (!description.trim() || description.trim().length < 15) {
      setError("Please describe the incident in at least 15 characters.");
      return;
    }
    if (contactDigits.trim() && contactDigits.trim().length !== 10) {
      setError("Please enter all 10 digits after +63 (e.g. 9123456789).");
      return;
    }

    setSubmitting(true);
    setError(null);

    const reporterContact = contactDigits.trim() ? `0${contactDigits.trim()}` : undefined;

    try {
      const report = await createResidentIncident({
        title: title.trim(),
        category,
        incidentDate,
        location: location.trim(),
        description: description.trim(),
        reporterContact,
        attachmentUrl: attachmentUrl || undefined,
      });

      toast.success(
        `Incident report #${report.reportNumber} submitted successfully.`
      );
      router.push(`/resident/${residentId}/incidents`);
    } catch (err: any) {
      setError(err?.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Account Verification Warning Banner */}
      {!verified && (
        <div className="flex items-start gap-3.5 rounded-4xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <Lock className="size-5" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">
              Preview Mode — Account ID Verification Required
            </h3>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              You are viewing the Community Incident Report form in preview mode. You can inspect all fields and categories below, but your account ID must be verified by a barangay official before submitting official reports.
            </p>
          </div>
        </div>
      )}

      {/* Error Alert Box */}
      {error && (
        <div className="flex items-start gap-3.5 rounded-3xl border border-destructive/30 bg-destructive/10 p-4.5 text-sm text-destructive shadow-xs">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="flex-1">
            <h4 className="font-semibold">Unable to submit incident report</h4>
            <p className="mt-0.5 text-xs text-destructive/90">{error}</p>
          </div>
        </div>
      )}

      {/* Reporter Identity Summary */}
      <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
        <div className="flex items-start gap-3 border-b border-border pb-4">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
            <User className="size-4" aria-hidden />
          </div>
          <div className="flex flex-col gap-0.5 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Reporter Information (Filing Resident)
              </h2>
              <Badge variant="secondary" className="rounded-full text-xs font-normal border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="mr-1 size-3" /> Profile Auto-Attached
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your verified resident details are automatically associated with this incident report.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-3xl bg-muted/40 p-3.5 border border-border/50">
            <span className="text-[11px] font-medium text-muted-foreground">Reporter Full Name</span>
            <span className="text-xs font-semibold text-foreground">{reporterName || "Verified Resident"}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-3xl bg-muted/40 p-3.5 border border-border/50">
            <span className="text-[11px] font-medium text-muted-foreground">Registered Address</span>
            <span className="text-xs font-semibold text-foreground">{defaultPurok || "Barangay Libtangin"}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-3xl bg-muted/40 p-3.5 border border-border/50">
            <span className="text-[11px] font-medium text-muted-foreground">Contact Number</span>
            <span className="text-xs font-semibold text-foreground font-mono">
              {contactDigits ? `+63 ${contactDigits}` : "Not provided in profile"}
            </span>
          </div>
        </div>
      </section>

      {/* Categorized Multi-Column Section Grid */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Left / Main Column */}
        <div className="flex flex-col gap-6">
          {/* Section 1: Category Selection Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <AlertCircle className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  1. Incident Classification
                </h2>
                <p className="text-xs text-muted-foreground">
                  Select the category that best fits the community issue or concern.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {CATEGORIES.map((c) => {
                const isSelected = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      "flex flex-col gap-1.5 text-left rounded-3xl border p-4 outline-none transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border bg-background hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>{c.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="size-4 text-primary shrink-0" aria-hidden />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      {c.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 2: Subject & Narrative Description Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <FileText className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  2. Incident Summary & Narrative
                </h2>
                <p className="text-xs text-muted-foreground">
                  Provide a clear summary title and complete details of the incident.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="title"
                  className="text-xs font-semibold text-foreground"
                >
                  Incident Title / Short Subject <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  type="text"
                  required
                  placeholder="e.g. Loud late-night music in Purok 2, Broken streetlight near chapel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 rounded-2xl text-xs bg-background border-border"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="description"
                  className="text-xs font-semibold text-foreground"
                >
                  Full Narrative Description <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="description"
                  required
                  rows={6}
                  placeholder="Provide complete details about what happened, persons involved (if any), and what assistance is requested from barangay officials..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-3xl text-xs bg-background border-border p-4"
                />
                <p className="text-[11px] text-muted-foreground">
                  Minimum 15 characters required. Be objective and include key details.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right / Side Column */}
        <div className="flex flex-col gap-6">
          {/* Section 3: Time, Location & Contact Details Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <MapPin className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  3. Time & Location
                </h2>
                <p className="text-xs text-muted-foreground">
                  Specify when and where the incident occurred.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Custom Redesigned Date & Time Picker */}
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <CalendarIcon className="size-3.5 text-primary" aria-hidden />
                  Date & Time of Occurrence <span className="text-destructive">*</span>
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
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="location"
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                  >
                    <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
                    Location / Purok Street <span className="text-destructive">*</span>
                  </label>
                  {defaultPurok && location !== defaultPurok && (
                    <button
                      type="button"
                      onClick={restoreDefaultPurok}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      <Sparkles className="size-3 shrink-0" aria-hidden />
                      Use my Purok
                    </button>
                  )}
                </div>
                <Input
                  id="location"
                  type="text"
                  required
                  placeholder="e.g. Purok 4, Main Street beside Health Center"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-10 rounded-2xl text-xs bg-background border-border"
                />
                {isLocationPrefilled && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                    Pre-filled with your registered Purok
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="reporterContact"
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground"
                >
                  <Phone className="size-3.5 text-muted-foreground" aria-hidden />
                  Contact Phone Number <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <div className="flex h-10 w-full overflow-hidden rounded-2xl border border-border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
                  <span className="flex items-center justify-center bg-muted/60 px-3.5 font-mono font-bold text-xs text-primary border-e border-border shrink-0 select-none">
                    +63
                  </span>
                  <input
                    id="reporterContact"
                    type="tel"
                    maxLength={10}
                    placeholder="9123456789"
                    value={contactDigits}
                    onChange={(e) => setContactDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="flex-1 bg-transparent px-3 text-xs font-mono text-foreground outline-none border-none placeholder:text-muted-foreground"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isPhonePrefilled ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="size-3 shrink-0" aria-hidden />
                      Pre-filled from your profile
                    </span>
                  ) : contactDigits.length === 0 && profileDigits.length > 0 ? (
                    <button
                      type="button"
                      onClick={restoreProfilePhone}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline cursor-pointer"
                    >
                      <User className="size-3 shrink-0" aria-hidden />
                      Use my profile number
                    </button>
                  ) : (
                    <>The prefix <span className="font-mono font-semibold text-primary">+63</span> is fixed. Enter the remaining 10 digits.</>
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Proof & Media Evidence Attachment Card */}
          <section className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-start gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground shrink-0">
                <Paperclip className="size-4" aria-hidden />
              </div>
              <div className="flex flex-col gap-0.5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  4. Proof & Photo Evidence
                </h2>
                <p className="text-xs text-muted-foreground">
                  Attach photo proof or supporting documents (Optional).
                </p>
              </div>
            </div>

            {attachmentUrl ? (
              <div className="flex flex-col gap-3 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      <FileCheck className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">
                        {attachmentName || "Attached Proof File"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {attachmentSize
                          ? `${(attachmentSize / 1024 / 1024).toFixed(2)} MB · `
                          : ""}
                        Attachment Ready
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

                {attachmentUrl.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif|svg)$/) || attachmentUrl.includes("/image/upload/") || attachmentUrl.includes("cloudinary.com") ? (
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-1">
                    <img
                      src={attachmentUrl}
                      alt="Uploaded proof preview"
                      className="w-full h-auto max-h-48 object-cover rounded-xl"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border bg-muted/20 p-5 text-center cursor-pointer hover:bg-muted/40 hover:border-primary/50 transition-all">
                <input
                  type="file"
                  accept="image/*,application/pdf,text/plain,.doc,.docx"
                  disabled={uploadingProof || !verified}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {uploadingProof ? (
                  <div className="flex items-center gap-2 text-xs font-medium text-primary py-2">
                    <Loader2 className="size-4 animate-spin" />
                    Uploading attachment...
                  </div>
                ) : (
                  <>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <UploadCloud className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Click or drop file to attach photo proof
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
          <Link href={`/resident/${residentId}/incidents`}>
            Cancel
          </Link>
        </Button>

        <Button
          type="submit"
          disabled={!verified || submitting}
          className="rounded-full h-10 px-7 text-sm font-semibold shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
              <span>Submitting Report...</span>
            </>
          ) : !verified ? (
            <>
              <Lock className="mr-1.5 size-4" aria-hidden />
              <span>Verification Required</span>
            </>
          ) : (
            <span>Submit Incident Report</span>
          )}
        </Button>
      </div>
    </form>
  );
}
