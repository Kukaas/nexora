"use client";

import Link from "next/link";
import { ArrowLeft, Clock, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ResidencyStatus } from "@/lib/profile";

export function ResidencyReviewNotice({
  status,
  residentId,
  returnUrl,
  title,
  description,
}: {
  status: ResidencyStatus;
  residentId: string;
  returnUrl?: string;
  title?: string;
  description?: string;
}) {
  const rejected = status === "rejected";
  const redirectQuery = returnUrl ? `?redirect=${encodeURIComponent(returnUrl)}` : "";
  const backTarget = returnUrl || `/resident/${residentId}`;

  return (
    <Card className="rounded-4xl border border-border shadow-sm ring-1 ring-foreground/5">
      <CardHeader>
        <span
          className={
            rejected
              ? "flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
              : "flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground"
          }
        >
          {rejected ? (
            <ShieldAlert className="size-5.5" aria-hidden />
          ) : (
            <Clock className="size-5.5" aria-hidden />
          )}
        </span>
        <CardTitle className="mt-3 text-xl font-semibold tracking-tight">
          {title || (rejected ? "We couldn't verify your ID" : "Account ID Verification Required")}
        </CardTitle>
        <CardDescription className="text-pretty text-sm text-muted-foreground">
          {description ||
            (rejected
              ? "The ID you submitted couldn't be verified. Please resubmit a valid government ID or visit Barangay Libtangin hall."
              : "An official is currently reviewing your submitted ID. To ensure community accountability, ID verification is required before you can officially submit incident reports, file blotter cases, or request barangay documents.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm">
          {[
            { label: "Account created", done: true },
            { label: "ID submitted", done: true },
            {
              label: rejected ? "Verification rejected" : "Official review",
              done: false,
              current: true,
              bad: rejected,
            },
            { label: "Full portal & filing access", done: false },
          ].map((step) => (
            <li key={step.label} className="flex items-center gap-3">
              <span
                className={
                  step.done
                    ? "flex size-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : step.bad
                      ? "flex size-6 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                      : step.current
                        ? "flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground"
                        : "flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
                }
              >
                {step.done ? (
                  <ShieldCheck className="size-3.5" aria-hidden />
                ) : step.bad ? (
                  <ShieldAlert className="size-3.5" aria-hidden />
                ) : (
                  <Clock className="size-3.5" aria-hidden />
                )}
              </span>
              <span
                className={
                  step.done || step.current
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-3 pt-2">
        {rejected ? (
          <Button asChild>
            <Link href={`/resident/resubmit${redirectQuery}`}>
              <RefreshCw className="size-4" />
              Resubmit ID
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="rounded-full">
            <Link href={backTarget}>
              <ArrowLeft className="size-4" />
              Return to Overview
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
