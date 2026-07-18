"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { changeAccountPassword } from "@/lib/auth-actions";
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

const schema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128, "That password is too long."),
    confirmPassword: z.string().min(1, "Re-enter your new password."),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from your current one.",
  });

type Values = z.infer<typeof schema>;

export function PasswordForm({ backHref }: { backHref: string }) {
  const router = useRouter();
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: Values) => {
    setFormError(null);
    const result = await changeAccountPassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast.success("Password updated.");
    router.push(backHref);
    router.refresh();
  };

  return (
    <div>
      {formError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.currentPassword}>
            <FieldLabel htmlFor={currentId}>Current password</FieldLabel>
            <div className="relative">
              <Input
                id={currentId}
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                aria-invalid={!!errors.currentPassword}
                disabled={isSubmitting}
                className="pr-11"
                {...register("currentPassword")}
              />
              <PasswordToggle
                shown={showCurrent}
                onToggle={() => setShowCurrent((s) => !s)}
                disabled={isSubmitting}
              />
            </div>
            {errors.currentPassword && (
              <FieldError>{errors.currentPassword.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.newPassword}>
            <FieldLabel htmlFor={newId}>New password</FieldLabel>
            <div className="relative">
              <Input
                id={newId}
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                disabled={isSubmitting}
                className="pr-11"
                {...register("newPassword")}
              />
              <PasswordToggle
                shown={showNew}
                onToggle={() => setShowNew((s) => !s)}
                disabled={isSubmitting}
              />
            </div>
            {errors.newPassword ? (
              <FieldError>{errors.newPassword.message}</FieldError>
            ) : (
              <FieldDescription>At least 8 characters.</FieldDescription>
            )}
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor={confirmId}>Confirm new password</FieldLabel>
            <Input
              id={confirmId}
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <FieldError>{errors.confirmPassword.message}</FieldError>
            )}
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={isSubmitting}
              onClick={() => router.push(backHref)}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Saving…" : "Update password"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}

function PasswordToggle({
  shown,
  onToggle,
  disabled,
}: {
  shown: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={shown ? "Hide password" : "Show password"}
      aria-pressed={shown}
      className="absolute inset-y-0 right-1.5 my-auto flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
    >
      {shown ? (
        <EyeOff className="size-4" aria-hidden />
      ) : (
        <Eye className="size-4" aria-hidden />
      )}
    </button>
  );
}
