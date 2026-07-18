import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldAlert, ShieldCheck, ShieldQuestion, UsersRound } from "lucide-react";

import { getAssignedPurok, getPurokResidents } from "@/lib/kagawad-data";
import { purokLabel } from "@/lib/purok";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, initialsOf } from "../../../admin/_data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const metadata: Metadata = {
  title: "Residents · Kagawad · Barangay Libtangin",
};

export default async function KagawadResidentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const purok = await getAssignedPurok(id);
  if (!purok) redirect(`/kagawad/${id}`);

  const residents = await getPurokResidents(purok);
  const label = purokLabel(purok);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {label} residents
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground text-pretty">
          Everyone registered under {label}. Verification is handled by the
          barangay office; this list is for reaching and serving your purok.
        </p>
      </header>

      {residents.length === 0 ? (
        <div className="rounded-4xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UsersRound className="size-5" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground text-pretty">
            No residents have registered under {label} yet.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-4xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Resident</TableHead>
                  <TableHead className="hidden sm:table-cell">Mobile</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="hidden pr-5 text-right md:table-cell">
                    Registered
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {initialsOf(r.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {r.name}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground tabular-nums sm:table-cell">
                      {r.mobileNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ResidencyBadge status={r.residency} />
                    </TableCell>
                    <TableCell className="hidden pr-5 text-right text-sm text-muted-foreground tabular-nums md:table-cell">
                      {formatDate(r.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {residents.length}{" "}
            {residents.length === 1 ? "resident" : "residents"} registered under{" "}
            {label}.
          </p>
        </>
      )}
    </div>
  );
}

function ResidencyBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const meta = {
    approved: {
      label: "Verified",
      icon: ShieldCheck,
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    pending: {
      label: "Pending review",
      icon: ShieldQuestion,
      className: "bg-muted text-muted-foreground",
    },
    rejected: {
      label: "Needs resubmission",
      icon: ShieldAlert,
      className: "bg-destructive/10 text-destructive",
    },
  }[status];
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-3xl px-2.5 text-xs font-medium",
        meta.className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {meta.label}
    </span>
  );
}
