"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Check,
  Heart,
  Loader2,
  Plus,
  Save,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  addHouseholdMember,
  removeHouseholdMember,
  updateHouseholdWelfare,
  updateMemberWelfareFlags,
} from "@/lib/household-actions";
import type {
  HouseholdDTO,
  HouseholdMemberDTO,
  HouseholdRole,
} from "@/lib/household-data";

export interface HouseholdDetailProps {
  household: HouseholdDTO;
  basePath: string;
  availableResidents: { id: string; name: string; email: string; householdId: string | null }[];
}

const ROLES: { value: HouseholdRole; label: string }[] = [
  { value: "HEAD", label: "Head of Household" },
  { value: "SPOUSE", label: "Spouse" },
  { value: "CHILD", label: "Child / Dependent" },
  { value: "PARENT", label: "Parent" },
  { value: "RELATIVE", label: "Relative" },
  { value: "OTHER", label: "Other Member" },
];

export function HouseholdDetail({ household, basePath, availableResidents }: HouseholdDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Household welfare state
  const [is4Ps, setIs4Ps] = useState(household.is4Ps);
  const [isIndigent, setIsIndigent] = useState(household.isIndigent);
  const [hasSenior, setHasSenior] = useState(household.hasSenior);
  const [hasPWD, setHasPWD] = useState(household.hasPWD);
  const [hasSoloParent, setHasSoloParent] = useState(household.hasSoloParent);

  // Add member state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<HouseholdRole>("CHILD");

  const handleSaveWelfare = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await updateHouseholdWelfare(household.id, {
        is4Ps,
        isIndigent,
        hasSenior,
        hasPWD,
        hasSoloParent,
      });
      setMsg("Household welfare indicators saved successfully.");
      router.refresh();
    } catch (err: any) {
      setMsg("Failed to save welfare indicators.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMemberFlag = async (
    member: HouseholdMemberDTO,
    flagKey: "isSenior" | "isPWD" | "isSoloParent" | "is4PsBeneficiary"
  ) => {
    const newFlags = {
      isSenior: member.isSenior,
      isPWD: member.isPWD,
      isSoloParent: member.isSoloParent,
      is4PsBeneficiary: member.is4PsBeneficiary,
      [flagKey]: !member[flagKey],
    };

    try {
      await updateMemberWelfareFlags(member.id, newFlags);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    try {
      await addHouseholdMember(household.id, selectedUserId, selectedRole);
      setSelectedUserId("");
      router.refresh();
    } catch (err: any) {
      setMsg("Failed to add member.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the household?")) return;
    setLoading(true);
    try {
      await removeHouseholdMember(userId);
      router.refresh();
    } catch (err: any) {
      setMsg("Failed to remove member.");
    } finally {
      setLoading(false);
    }
  };

  const unassignedResidents = availableResidents.filter(
    (r) => !r.householdId || r.householdId === household.id
  );

  const purokLabel = household.purok.replace("PUROK_", "Purok ");

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation */}
      <Link
        href={basePath}
        className="inline-flex w-fit items-center gap-1.5 rounded-2xl text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to Households
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance font-mono">
              {household.householdNumber}
            </h1>
            <Badge variant="secondary" className="rounded-full">
              {purokLabel}
            </Badge>
            {household.is4Ps && (
              <Badge variant="outline" className="rounded-full border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                4Ps Household
              </Badge>
            )}
            {household.isIndigent && (
              <Badge variant="outline" className="rounded-full border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                Indigent Family
              </Badge>
            )}
          </div>
          <p className="max-w-prose text-sm text-muted-foreground text-pretty">
            {household.streetAddress}
          </p>
        </div>
      </header>

      {msg && (
        <div className="p-4 rounded-3xl bg-accent/40 border border-border text-sm font-medium text-foreground">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] items-start gap-6">
        {/* Left Column: Household Members & Add Member Form */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Members List */}
          <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Users className="size-4.5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Household Members ({household.members.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Registered residents in this household and their individual welfare flags.
                </p>
              </div>
            </div>

            {household.members.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm rounded-3xl border border-dashed border-border bg-muted/20">
                No members assigned to this household yet.
              </div>
            ) : (
              <div className="divide-y divide-border rounded-3xl border border-border overflow-hidden">
                {household.members.map((m) => (
                  <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{m.name}</span>
                        <Badge variant="outline" className="text-[10px] rounded-full">
                          {m.relationshipToHead || "MEMBER"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                      {m.mobileNumber && (
                        <p className="text-xs text-muted-foreground">Mobile: {m.mobileNumber}</p>
                      )}
                    </div>

                    {/* Individual Member Welfare Badges / Toggles */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleToggleMemberFlag(m, "isSenior")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          m.isSenior
                            ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30"
                            : "bg-muted text-muted-foreground opacity-60 hover:opacity-100"
                        }`}
                      >
                        {m.isSenior ? "Senior ✓" : "+ Senior"}
                      </button>

                      <button
                        onClick={() => handleToggleMemberFlag(m, "isPWD")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          m.isPWD
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-muted text-muted-foreground opacity-60 hover:opacity-100"
                        }`}
                      >
                        {m.isPWD ? "PWD ✓" : "+ PWD"}
                      </button>

                      <button
                        onClick={() => handleToggleMemberFlag(m, "isSoloParent")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          m.isSoloParent
                            ? "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30"
                            : "bg-muted text-muted-foreground opacity-60 hover:opacity-100"
                        }`}
                      >
                        {m.isSoloParent ? "Solo Parent ✓" : "+ Solo Parent"}
                      </button>

                      <button
                        onClick={() => handleToggleMemberFlag(m, "is4PsBeneficiary")}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          m.is4PsBeneficiary
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            : "bg-muted text-muted-foreground opacity-60 hover:opacity-100"
                        }`}
                      >
                        {m.is4PsBeneficiary ? "4Ps Member ✓" : "+ 4Ps Member"}
                      </button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveMember(m.id)}
                        className="size-7 rounded-full text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Add Member Form */}
          <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <UserPlus className="size-4.5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Add Resident to Household
                </h2>
                <p className="text-xs text-muted-foreground">
                  Assign an unassigned resident to this household.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-2 md:col-span-1">
                <Label>Select Resident</Label>
                <ResidentSelect
                  residents={unassignedResidents}
                  value={selectedUserId}
                  onSelect={(resId) => setSelectedUserId(resId)}
                  placeholder="Search resident..."
                  clearLabel="Select Resident..."
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-1">
                <Label htmlFor="roleSelect">Family Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as HouseholdRole)}
                >
                  <SelectTrigger id="roleSelect" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-1">
                <Button
                  type="submit"
                  disabled={loading || !selectedUserId}
                  className="w-full rounded-2xl h-10 font-semibold"
                >
                  <Plus className="mr-1.5 size-4" />
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Household Welfare Controls */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-5 rounded-4xl border border-border bg-card p-5 sm:p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Heart className="size-4.5" aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Welfare Program Tags
                </h2>
                <p className="text-xs text-muted-foreground">
                  Family-level government assistance tags.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-3xl border border-border bg-muted/20">
                <div>
                  <Label htmlFor="h4ps" className="font-semibold cursor-pointer text-sm">
                    4Ps Beneficiary
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Receives 4Ps government aid</p>
                </div>
                <Checkbox
                  id="h4ps"
                  checked={is4Ps}
                  onCheckedChange={(c) => setIs4Ps(Boolean(c))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-3xl border border-border bg-muted/20">
                <div>
                  <Label htmlFor="hindigent" className="font-semibold cursor-pointer text-sm">
                    Indigent Family
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Indigent classification</p>
                </div>
                <Checkbox
                  id="hindigent"
                  checked={isIndigent}
                  onCheckedChange={(c) => setIsIndigent(Boolean(c))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-3xl border border-border bg-muted/20">
                <div>
                  <Label htmlFor="hsenior" className="font-semibold cursor-pointer text-sm">
                    Has Senior Citizen
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Elderly family member</p>
                </div>
                <Checkbox
                  id="hsenior"
                  checked={hasSenior}
                  onCheckedChange={(c) => setHasSenior(Boolean(c))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-3xl border border-border bg-muted/20">
                <div>
                  <Label htmlFor="hpwd" className="font-semibold cursor-pointer text-sm">
                    Has PWD Member
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Person with Disability</p>
                </div>
                <Checkbox
                  id="hpwd"
                  checked={hasPWD}
                  onCheckedChange={(c) => setHasPWD(Boolean(c))}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-3xl border border-border bg-muted/20">
                <div>
                  <Label htmlFor="hsolo" className="font-semibold cursor-pointer text-sm">
                    Has Solo Parent
                  </Label>
                  <p className="text-[11px] text-muted-foreground">Solo parent member</p>
                </div>
                <Checkbox
                  id="hsolo"
                  checked={hasSoloParent}
                  onCheckedChange={(c) => setHasSoloParent(Boolean(c))}
                />
              </div>

              <Button
                type="button"
                onClick={handleSaveWelfare}
                disabled={loading}
                className="w-full rounded-2xl h-11 text-sm font-semibold shadow-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 size-4" />
                    Save Welfare Tags
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
