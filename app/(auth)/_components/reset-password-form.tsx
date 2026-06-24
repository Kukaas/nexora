"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, CircleCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirm: z.string().min(1, "Re-enter your new password."),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match.",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error");

  const passwordId = useId();
  const confirmId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    if (formError) alertRef.current?.focus();
  }, [formError]);

  // No token, or Better Auth bounced back with an error: the link is unusable.
  if (!token || tokenError) {
    return (
      <div className="flex flex-col gap-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            This link has expired
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Password reset links can only be used once and expire after a short
            time. Request a new one to continue.
          </p>
        </div>
        <Button asChild size="lg" className="w-fit">
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
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

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CircleCheck className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Password updated
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Your password has been changed. You can now sign in with it.
          </p>
        </div>
        <Button asChild size="lg" className="w-fit">
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (values: Values) => {
    setFormError(null);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    if (error) {
      setFormError(
        error.message ||
          "We couldn't reset your password. The link may have expired.",
      );
      return;
    }

    setDone(true);
    toast.success("Password updated. Please sign in.");
    router.refresh();
  };

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Set a new password
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Choose a password you don&apos;t use anywhere else. Make it at least 8
          characters.
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
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor={passwordId}>New password</FieldLabel>
            <div className="relative">
              <Input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? `${passwordId}-error` : undefined
                }
                disabled={isSubmitting}
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                disabled={isSubmitting}
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

          <Field data-invalid={!!errors.confirm}>
            <FieldLabel htmlFor={confirmId}>Confirm new password</FieldLabel>
            <Input
              id={confirmId}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              aria-invalid={!!errors.confirm}
              aria-describedby={errors.confirm ? `${confirmId}-error` : undefined}
              disabled={isSubmitting}
              {...register("confirm")}
            />
            {errors.confirm && (
              <FieldError id={`${confirmId}-error`}>
                {errors.confirm.message}
              </FieldError>
            )}
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
