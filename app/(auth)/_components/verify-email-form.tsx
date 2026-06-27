"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CircleCheck, MailWarning } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { NexoraGlyph } from "./nexora-mark";

type Status = "verifying" | "success" | "error";

/** Best-effort read of the email from the JWT payload, only to offer a resend. */
function emailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [isResending, setIsResending] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    // Run exactly once (guards against React 19 dev double-invoke, which would
    // otherwise verify twice and flip a success into a "token already used" error).
    if (startedRef.current) return;
    startedRef.current = true;

    if (!token) {
      setStatus("error");
      return;
    }

    let active = true;
    (async () => {
      const { error } = await authClient.verifyEmail({ query: { token } });
      if (!active) return;
      if (error) {
        setStatus("error");
        return;
      }
      setStatus("success");
      // Verification auto-signs the user in; send them into the app.
      setTimeout(() => {
        router.push("/sign-in");
        router.refresh();
      }, 1800);
    })();

    return () => {
      active = false;
    };
  }, [token, router]);

  if (status === "verifying") {
    return (
      <div
        className="flex flex-col items-center gap-5 text-center"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex size-16 items-center justify-center">
          <Spinner className="absolute size-16 text-primary/30" />
          <NexoraGlyph className="size-8 text-primary" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Verifying your email
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Hang tight, this only takes a moment.
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Email verified
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Your account is active. Taking you to Barangay Libtangin now.
          </p>
        </div>
        <Button asChild size="lg" className="w-fit">
          <Link href="/sign-in">Continue</Link>
        </Button>
      </div>
    );
  }

  // status === "error"
  const email = emailFromToken(token);

  const resend = async () => {
    if (!email) return;
    setIsResending(true);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/",
    });
    setIsResending(false);
    if (error) {
      toast.error("We couldn't send the email. Please try again in a moment.");
      return;
    }
    toast.success("New verification email sent. Check your inbox.");
  };

  return (
    <div className="flex flex-col gap-5">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <MailWarning className="size-6" aria-hidden />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          This link didn&apos;t work
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Verification links can only be used once and expire after a short
          time. {email ? "Send yourself a fresh one below." : "Sign in to request a new one."}
        </p>
      </div>
      {email && (
        <Button
          type="button"
          size="lg"
          onClick={resend}
          disabled={isResending}
          className="w-fit"
        >
          {isResending && <Spinner />}
          {isResending ? "Sending..." : "Resend verification email"}
        </Button>
      )}
      <Link
        href="/sign-in"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}
