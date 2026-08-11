"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Heart,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Purok } from "@/app/generated/prisma/enums";
import { createHousehold } from "@/lib/household-actions";

export interface HouseholdFormProps {
  basePath: string;
  residents?: { id: string; name: string; email: string }[];
}

const PUROKS: { value: Purok; label: string }[] = [
  { value: "PUROK_1", label: "Purok 1" },
  { value: "PUROK_2", label: "Purok 2" },
  { value: "PUROK_3", label: "Purok 3" },
  { value: "PUROK_4", label: "Purok 4" },
  { value: "PUROK_5", label: "Purok 5" },
  { value: "PUROK_6", label: "Purok 6" },
  { value: "PUROK_7", label: "Purok 7" },
];

export function HouseholdForm({ basePath, residents = [] }: HouseholdFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [purok, setPurok] = useState<Purok>("PUROK_1");
  const [streetAddress, setStreetAddress] = useState("");
  const [headId, setHeadId] = useState("");
  const [householdNumber, setHouseholdNumber] = useState("");

  const [is4Ps, setIs4Ps] = useState(false);
  const [isIndigent, setIsIndigent] = useState(false);
  const [hasSenior, setHasSenior] = useState(false);
  const [hasPWD, setHasPWD] = useState(false);
  const [hasSoloParent, setHasSoloParent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress.trim()) {
      setError("Street address is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createHousehold({
        householdNumber: householdNumber.trim() || undefined,
        purok,
        streetAddress,
        headId: headId || undefined,
        is4Ps,
        isIndigent,
        hasSenior,
        hasPWD,
        hasSoloParent,
      });

      router.push(basePath);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create household.");
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
        Back to Households
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Register New Household
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground text-pretty">
          Create an official household registry record, specify street address, head of household, and social welfare program indicators.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
          <ShieldAlert className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-6">
          {/* Card 1: Identification & Location */}
          <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Building2 className="size-4.5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  1. Identification & Address
                </h2>
                <p className="text-xs text-muted-foreground">
                  Purok location, household reference number, and street address.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="purok">Purok Location</Label>
                <Select
                  value={purok}
                  onValueChange={(v) => setPurok(v as Purok)}
                  disabled={loading}
                >
                  <SelectTrigger id="purok" className="w-full">
                    <SelectValue placeholder="Select purok location" />
                  </SelectTrigger>
                  <SelectContent>
                    {PUROKS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="householdNumber">
                  Household #{" "}
                  <span className="font-normal text-muted-foreground">(Auto-generated if blank)</span>
                </Label>
                <Input
                  id="householdNumber"
                  placeholder="e.g. HH-P1-0042"
                  value={householdNumber}
                  onChange={(e) => setHouseholdNumber(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="streetAddress">
                  Street Address / House # <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="streetAddress"
                  placeholder="e.g. 104 Main Street, Zone 2"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  required
                />
              </div>

              {residents.length > 0 && (
                <div className="flex flex-col gap-2 sm:col-span-2 pt-1">
                  <Label>Head of Household (Optional)</Label>
                  <ResidentSelect
                    residents={residents}
                    value={headId}
                    onSelect={(resId) => setHeadId(resId)}
                    placeholder="Search resident as Head of Household..."
                    clearLabel="No Head Assigned"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Welfare Program Indicators */}
          <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Heart className="size-4.5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  2. Social Welfare & Vulnerability Flags
                </h2>
                <p className="text-xs text-muted-foreground">
                  Government aid programs, indigency status, and family member vulnerability categories.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-start space-x-3 p-3.5 rounded-3xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="is4Ps"
                  checked={is4Ps}
                  onCheckedChange={(c) => setIs4Ps(Boolean(c))}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="is4Ps" className="font-semibold cursor-pointer text-sm">
                    4Ps Beneficiary Household
                  </Label>
                  <p className="text-xs text-muted-foreground">Pantawid Pamilyang Pilipino Program recipient</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3.5 rounded-3xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="isIndigent"
                  checked={isIndigent}
                  onCheckedChange={(c) => setIsIndigent(Boolean(c))}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="isIndigent" className="font-semibold cursor-pointer text-sm">
                    Indigent Family Status
                  </Label>
                  <p className="text-xs text-muted-foreground">Low-income / indigent classification</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3.5 rounded-3xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="hasSenior"
                  checked={hasSenior}
                  onCheckedChange={(c) => setHasSenior(Boolean(c))}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="hasSenior" className="font-semibold cursor-pointer text-sm">
                    Has Senior Citizen Member
                  </Label>
                  <p className="text-xs text-muted-foreground">Elderly resident age 60 and above</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3.5 rounded-3xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="hasPWD"
                  checked={hasPWD}
                  onCheckedChange={(c) => setHasPWD(Boolean(c))}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="hasPWD" className="font-semibold cursor-pointer text-sm">
                    Has PWD Member
                  </Label>
                  <p className="text-xs text-muted-foreground">Person with Disability member</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3.5 rounded-3xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <Checkbox
                  id="hasSoloParent"
                  checked={hasSoloParent}
                  onCheckedChange={(c) => setHasSoloParent(Boolean(c))}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="hasSoloParent" className="font-semibold cursor-pointer text-sm">
                    Has Solo Parent Member
                  </Label>
                  <p className="text-xs text-muted-foreground">Registered Solo Parent under RA 11861</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild disabled={loading} className="rounded-2xl">
            <Link href={basePath}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="rounded-2xl">
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Save Household Record
          </Button>
        </div>
      </form>
    </div>
  );
}
