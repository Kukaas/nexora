"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, MailCheck } from "lucide-react";

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

const schema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const emailId = useId();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: Values) => {
    setFormError(null);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });

    if (error) {
      setFormError("Something went wrong. Please try again in a moment.");
      return;
    }
    // Always confirm without revealing whether the address has an account.
    setSentTo(values.email);
  };

  if (sentTo) {
    return (
      <div className="flex flex-col gap-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            If an account exists for{" "}
            <span className="font-medium text-foreground break-all">
              {sentTo}
            </span>
            , we sent a link to reset your password. It expires soon, so use it
            promptly.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setSentTo(null)}
          className="w-fit"
        >
          Use a different email
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

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Enter the email on your account and we&apos;ll send a link to set a new
          password.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
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
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <FieldError id={`${emailId}-error`}>
                {errors.email.message}
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
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </FieldGroup>
      </form>

      <Link
        href="/sign-in"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}
