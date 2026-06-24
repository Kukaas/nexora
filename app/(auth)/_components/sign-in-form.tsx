"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { GoogleIcon } from "./google-icon";

const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  // Move focus to the alert when an auth-level problem appears, so screen-reader
  // and keyboard users land on the explanation instead of hunting for it.
  useEffect(() => {
    if (formError || unverifiedEmail) {
      alertRef.current?.focus();
    }
  }, [formError, unverifiedEmail]);

  const onSubmit = async (values: SignInValues) => {
    setFormError(null);
    setUnverifiedEmail(null);

    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
      rememberMe,
    });

    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED" || error.status === 403) {
        setUnverifiedEmail(values.email);
      } else {
        setFormError(
          error.message ||
            "We couldn't sign you in. Check your email and password, then try again.",
        );
      }
      return;
    }

    router.push("/");
    router.refresh();
  };

  const resendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    const { error } = await authClient.sendVerificationEmail({
      email: unverifiedEmail,
      callbackURL: "/",
    });
    setIsResending(false);

    if (error) {
      toast.error("We couldn't send the email. Please try again in a moment.");
      return;
    }
    toast.success("Verification email sent. Check your inbox and spam folder.");
  };

  const signInWithGoogle = async () => {
    setFormError(null);
    setUnverifiedEmail(null);
    setIsGoogleLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    // On success the browser redirects to Google, so we only reach here on error.
    if (error) {
      setIsGoogleLoading(false);
      toast.error("Google sign-in isn't available right now.");
    }
  };

  const busy = isSubmitting || isGoogleLoading;

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Sign in to Nexora
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Welcome back. Sign in to manage your barangay requests.
        </p>
      </div>

      {/* Auth-level error (wrong credentials, server problem). */}
      {formError && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="mt-6 flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      {/* Unverified email: explain and offer a resend. */}
      {unverifiedEmail && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="mt-6 rounded-2xl bg-accent px-4 py-3.5 text-sm text-accent-foreground outline-none"
        >
          <div className="flex items-start gap-2.5">
            <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div className="flex flex-col gap-2">
              <p>
                Confirm your email first. We sent a link to{" "}
                <span className="font-medium break-all">{unverifiedEmail}</span>.
                Open it to activate your account, then sign in.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resendVerification}
                disabled={isResending}
                className="w-fit bg-background"
              >
                {isResending && <Spinner />}
                {isResending ? "Sending..." : "Resend verification email"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7">
        <FieldGroup>
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor={emailId}>Email</FieldLabel>
            <Input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              placeholder="juan.delacruz@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
              disabled={busy}
              {...register("email")}
            />
            {errors.email && (
              <FieldError id={`${emailId}-error`}>
                {errors.email.message}
              </FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.password}>
            <div className="flex items-center justify-between gap-3">
              <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? `${passwordId}-error` : undefined
                }
                disabled={busy}
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={busy}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-1.5 my-auto flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
              </button>
            </div>
            {errors.password && (
              <FieldError id={`${passwordId}-error`}>
                {errors.password.message}
              </FieldError>
            )}
          </Field>

          <Field orientation="horizontal" className="items-center">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={busy}
            />
            <Label htmlFor="remember-me" className="font-normal">
              Keep me signed in
            </Label>
          </Field>

          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </FieldGroup>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={signInWithGoogle}
        disabled={busy}
        className="w-full"
      >
        {isGoogleLoading ? <Spinner /> : <GoogleIcon className="size-4" />}
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        New to Nexora?{" "}
        <Link
          href="/sign-up"
          className={cn(
            "font-medium text-foreground underline-offset-4",
            "transition-colors hover:text-primary hover:underline",
          )}
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
