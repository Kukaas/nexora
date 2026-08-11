"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Loader2,
  MapPin,
  Save,
  ShieldAlert,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResidentSelect } from "./resident-select";
import { createBlotterRecord } from "@/lib/blotter-actions";
import type { IncidentType } from "@/lib/blotter-data";

export interface BlotterFormProps {
  basePath: string;
  residents?: { id: string; name: string; email: string }[];
}

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: "NEIGHBOR_DISPUTE", label: "Neighbor Dispute" },
  { value: "NOISE_COMPLAINT", label: "Noise Complaint" },
  { value: "PHYSICAL_INJURY", label: "Physical Injury" },
  { value: "PROPERTY_DAMAGE", label: "Property Damage" },
  { value: "THEFT", label: "Theft" },
  { value: "THREATS", label: "Threats" },
  { value: "DOMESTIC", label: "Domestic Issue" },
  { value: "OTHER", label: "Other Incident" },
];

export function BlotterForm({ basePath, residents = [] }: BlotterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [complainantName, setComplainantName] = useState("");
  const [complainantContact, setComplainantContact] = useState("");
  const [complainantId, setComplainantId] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [respondentAddress, setRespondentAddress] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType>("NEIGHBOR_DISPUTE");
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [incidentLocation, setIncidentLocation] = useState("");
  const [narrative, setNarrative] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);

  const handleSelectResident = (resId: string) => {
    setComplainantId(resId);
    if (resId) {
      const res = residents.find((r) => r.id === resId);
      if (res) setComplainantName(res.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complainantName.trim()) {
      setError("Complainant name is required.");
      return;
    }
    if (!respondentName.trim()) {
      setError("Respondent name is required.");
      return;
    }
    if (!incidentLocation.trim()) {
      setError("Incident location is required.");
      return;
    }
    if (!narrative.trim()) {
      setError("Incident narrative is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createBlotterRecord({
        incidentType,
        incidentDate,
        incidentLocation,
        complainantId: complainantId || undefined,
        complainantName,
        complainantContact,
        respondentName,
        respondentAddress,
        narrative,
        isConfidential,
      });

      router.push(basePath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create blotter entry.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={basePath}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to blotter records
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          File New Incident Report
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Encode an official barangay blotter complaint record, party details, location, and case statements.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          <ShieldAlert className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] items-start gap-6">
          {/* Main Narrative Column */}
          <div className="flex flex-col gap-6">
            {/* Card 1: Complainant Information */}
            <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <ShieldAlert className="size-4.5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    1. Complainant Information
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Complainant details and linked resident account.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {residents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label>Link Registered Resident Account (Optional)</Label>
                    <ResidentSelect
                      residents={residents}
                      value={complainantId}
                      onSelect={(resId) => handleSelectResident(resId)}
                      placeholder="Search registered resident account..."
                      clearLabel="Walk-in / Unregistered Complainant"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="complainantName">
                      Complainant Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="complainantName"
                      placeholder="e.g. Maria Santos"
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="complainantContact">Contact Number</Label>
                    <Input
                      id="complainantContact"
                      placeholder="e.g. 0917 123 4567"
                      value={complainantContact}
                      onChange={(e) => setComplainantContact(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Respondent Information */}
            <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <UserX className="size-4.5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    2. Respondent Information
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Details and address of the respondent party.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="respondentName">
                    Respondent Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="respondentName"
                    placeholder="e.g. Juan dela Cruz"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="respondentAddress">Respondent Address</Label>
                  <Input
                    id="respondentAddress"
                    placeholder="e.g. Purok 3, Main Street"
                    value={respondentAddress}
                    onChange={(e) => setRespondentAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Incident Narrative Statement */}
            <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <FileText className="size-4.5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    3. Incident Narrative Statement
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Official description of events, timeline, and statements of involved parties.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="narrative">
                  Statement / Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="narrative"
                  rows={6}
                  placeholder="Describe the incident details, sequence of events, and verbal or physical actions involved..."
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  className="min-h-[140px] resize-y"
                  required
                />
              </div>
            </div>
          </div>

          {/* Right Categorization & Settings Sidebar Column */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <MapPin className="size-4.5" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    4. Classification & Location
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Incident type, schedule, and geotagging details.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="incidentType">Incident Classification</Label>
                  <Select
                    value={incidentType}
                    onValueChange={(v) => setIncidentType(v as IncidentType)}
                    disabled={loading}
                  >
                    <SelectTrigger id="incidentType" className="w-full">
                      <SelectValue placeholder="Select incident classification" />
                    </SelectTrigger>
                    <SelectContent>
                      {INCIDENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="incidentDate">Incident Date & Time</Label>
                  <Input
                    id="incidentDate"
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="incidentLocation">
                    Incident Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="incidentLocation"
                    placeholder="e.g. Near Purok 2 Basketball Court"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-3xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors mt-1">
                  <Checkbox
                    id="isConfidential"
                    checked={isConfidential}
                    onCheckedChange={(c) => setIsConfidential(Boolean(c))}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="isConfidential" className="font-semibold cursor-pointer text-xs">
                      Mark as Confidential Record
                    </Label>
                    <p className="text-[11px] text-muted-foreground">Restricts visibility to authorized officials</p>
                  </div>
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
            File Incident Record
          </Button>
        </div>
      </form>
    </div>
  );
}
