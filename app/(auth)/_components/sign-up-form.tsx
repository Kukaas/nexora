"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { registerResident } from "@/lib/auth-actions";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { GoogleIcon } from "./google-icon";

const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, "Enter your email address.")
      .email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string().min(1, "Re-enter your password."),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  useEffect(() => {
    if (formError) alertRef.current?.focus();
  }, [formError]);

  const onSubmit = async (values: SignUpValues) => {
    setFormError(null);
    const result = await registerResident({
      email: values.email,
      password: values.password,
    });

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setRegisteredEmail(values.email);
  };

  const resendVerification = async () => {
    if (!registeredEmail) return;
    setIsResending(true);
    const { error } = await authClient.sendVerificationEmail({
      email: registeredEmail,
      callbackURL: "/",
    });
    setIsResending(false);
    if (error) {
      toast.error("We couldn't send the email. Please try again in a moment.");
      return;
    }
    toast.success("Verification email sent. Check your inbox and spam folder.");
  };

  const signUpWithGoogle = async () => {
    setFormError(null);
    setIsGoogleLoading(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      // /start resolves the user's role and forwards them to their home.
      callbackURL: "/start",
      // If this Google email already has a password account, send them to
      // sign-in, where the message explains to use email and password instead.
      errorCallbackURL: "/sign-in",
    });
    if (error) {
      setIsGoogleLoading(false);
      toast.error("Google sign-in isn't available right now.");
    }
  };

  // Verification is mandatory, so success is "go check your inbox", not a session.
  if (registeredEmail) {
    return (
      <div className="flex flex-col gap-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Confirm your email
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground break-all">
              {registeredEmail}
            </span>
            . Open it to activate your account, then sign in.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={resendVerification}
          disabled={isResending}
          className="w-fit"
        >
          {isResending && <Spinner />}
          {isResending ? "Sending..." : "Resend email"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Already confirmed?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const busy = isSubmitting || isGoogleLoading;

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Register with your email to request documents from Barangay Libtangin.
        </p>
      </div>

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
            <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password
                    ? `${passwordId}-error`
                    : `${passwordId}-hint`
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
            {errors.password ? (
              <FieldError id={`${passwordId}-error`}>
                {errors.password.message}
              </FieldError>
            ) : (
              <FieldDescription id={`${passwordId}-hint`}>
                Use at least 8 characters.
              </FieldDescription>
            )}
          </Field>

          <Field data-invalid={!!errors.confirm}>
            <FieldLabel htmlFor={confirmId}>Confirm password</FieldLabel>
            <Input
              id={confirmId}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? `${confirmId}-error` : undefined}
              disabled={busy}
              {...register("confirm")}
            />
            {errors.confirm && (
              <FieldError id={`${confirmId}-error`}>
                {errors.confirm.message}
              </FieldError>
            )}
          </Field>

          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Creating account..." : "Create account"}
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
        onClick={signUpWithGoogle}
        disabled={busy}
        className="w-full"
      >
        {isGoogleLoading ? <Spinner /> : <GoogleIcon className="size-4" />}
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </Button>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
