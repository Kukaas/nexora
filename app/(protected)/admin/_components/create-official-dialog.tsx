"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Check,
  Copy,
  KeyRound,
  MailCheck,
  MailWarning,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { createOfficial, type CreateOfficialInput } from "@/lib/admin-actions";
import { PUROK_LABELS, PUROK_ORDER } from "@/lib/purok";
import { UserRoles } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { ASSIGNABLE_ROLES, ROLE_META } from "../_data";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "Enter a first name."),
    middleName: z.string().trim().optional(),
    lastName: z.string().trim().min(1, "Enter a last name."),
    email: z
      .string()
      .trim()
      .min(1, "Enter an email address.")
      .email("Enter a valid email address."),
    role: z.enum(ASSIGNABLE_ROLES, { message: "Choose a role." }),
    purok: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === UserRoles.KAGAWAD && !val.purok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose the purok this kagawad is assigned to.",
        path: ["purok"],
      });
    }
  });

type Values = z.infer<typeof schema>;

type Created = {
  name: string;
  email: string;
  tempPassword: string;
  emailSent: boolean;
};

export function CreateOfficialDialog({
  children,
  variant,
  size,
  className,
}: {
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // When the dialog closes after a successful creation, pull the fresh list
    // into the current route, then reset for next time.
    if (!next && created) {
      router.refresh();
      setTimeout(() => setCreated(null), 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {created ? (
          <SuccessPanel
            created={created}
            onCreateAnother={() => setCreated(null)}
          />
        ) : (
          <CreateForm onCreated={setCreated} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({ onCreated }: { onCreated: (c: Created) => void }) {
  const firstId = useId();
  const middleId = useId();
  const lastId = useId();
  const emailId = useId();
  const roleId = useId();
  const purokId = useId();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      role: undefined,
      purok: undefined,
    },
  });

  const isKagawad = watch("role") === UserRoles.KAGAWAD;

  const onSubmit = async (values: Values) => {
    setFormError(null);
    const result = await createOfficial({
      ...values,
      purok: values.purok as CreateOfficialInput["purok"],
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    onCreated({
      name: result.name,
      email: result.email,
      tempPassword: result.tempPassword,
      emailSent: result.emailSent,
    });
  };

  return (
    <>
      <DialogHeader>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <UserPlus className="size-5" aria-hidden />
        </span>
        <DialogTitle className="mt-1 text-lg">Create official account</DialogTitle>
        <DialogDescription>
          Set up an account for a barangay official. They sign in with the
          temporary password you&apos;ll get next.
        </DialogDescription>
      </DialogHeader>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <FieldSet>
            <FieldLegend variant="label">Name</FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.firstName}>
                <FieldLabel htmlFor={firstId}>First name</FieldLabel>
                <Input
                  id={firstId}
                  autoComplete="off"
                  autoFocus
                  aria-invalid={!!errors.firstName}
                  disabled={isSubmitting}
                  placeholder="Maria"
                  {...register("firstName")}
                />
                {errors.firstName && (
                  <FieldError>{errors.firstName.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.lastName}>
                <FieldLabel htmlFor={lastId}>Last name</FieldLabel>
                <Input
                  id={lastId}
                  autoComplete="off"
                  aria-invalid={!!errors.lastName}
                  disabled={isSubmitting}
                  placeholder="Reyes"
                  {...register("lastName")}
                />
                {errors.lastName && (
                  <FieldError>{errors.lastName.message}</FieldError>
                )}
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor={middleId}>
                Middle name{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Input
                id={middleId}
                autoComplete="off"
                disabled={isSubmitting}
                placeholder="Santos"
                {...register("middleName")}
              />
            </Field>
          </FieldSet>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor={emailId}>Email</FieldLabel>
            <Input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="off"
              aria-invalid={!!errors.email}
              disabled={isSubmitting}
              placeholder="maria.reyes@libtangin.gov.ph"
              {...register("email")}
            />
            {errors.email ? (
              <FieldError>{errors.email.message}</FieldError>
            ) : (
              <FieldDescription>
                They&apos;ll use this to sign in. It can&apos;t be changed here
                later.
              </FieldDescription>
            )}
          </Field>

          <Field data-invalid={!!errors.role}>
            <FieldLabel htmlFor={roleId}>Role</FieldLabel>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id={roleId}
                    className="h-auto w-full py-2"
                    aria-invalid={!!errors.role}
                  >
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((role) => {
                      const meta = ROLE_META[role];
                      const Icon = meta.icon;
                      return (
                        <SelectItem key={role} value={role}>
                          <span className="flex items-center gap-2.5">
                            <Icon
                              className="size-4 text-muted-foreground"
                              aria-hidden
                            />
                            <span className="flex flex-col">
                              <span className="font-medium">{meta.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {meta.blurb}
                              </span>
                            </span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <FieldError>{errors.role.message}</FieldError>}
          </Field>

          {isKagawad && (
            <Field data-invalid={!!errors.purok}>
              <FieldLabel htmlFor={purokId}>Assigned purok</FieldLabel>
              <Controller
                control={control}
                name="purok"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id={purokId}
                      className="w-full"
                      aria-invalid={!!errors.purok}
                    >
                      <SelectValue placeholder="Choose a purok" />
                    </SelectTrigger>
                    <SelectContent>
                      {PUROK_ORDER.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PUROK_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.purok ? (
                <FieldError>{errors.purok.message}</FieldError>
              ) : (
                <FieldDescription>
                  The purok this kagawad oversees. Their announcements go to
                  residents of this purok.
                </FieldDescription>
              )}
            </Field>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <UserPlus />}
              {isSubmitting ? "Creating..." : "Create account"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </>
  );
}

function SuccessPanel({
  created,
  onCreateAnother,
}: {
  created: Created;
  onCreateAnother: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.tempPassword);
      setCopied(true);
      toast.success("Temporary password copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the password and copy it manually.");
    }
  };

  return (
    <>
      <DialogHeader>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <DialogTitle className="mt-1 text-lg">Account created</DialogTitle>
        <DialogDescription>
          The account for{" "}
          <span className="font-medium text-foreground">{created.name}</span> is
          ready under{" "}
          <span className="font-mono text-foreground break-all">
            {created.email}
          </span>
          .
        </DialogDescription>
      </DialogHeader>

      <div
        className={cn(
          "flex items-start gap-2.5 rounded-2xl px-3 py-2.5 text-xs",
          created.emailSent
            ? "bg-muted text-muted-foreground"
            : "bg-destructive/10 text-destructive",
        )}
      >
        {created.emailSent ? (
          <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        ) : (
          <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
        )}
        <span>
          {created.emailSent ? (
            <>
              A verification link was emailed to{" "}
              <span className="font-medium text-foreground">
                {created.email}
              </span>
              . They confirm it first, then sign in with the password below.
            </>
          ) : (
            <>
              The account exists, but we couldn&apos;t send the verification
              email. Ask them to use &ldquo;Resend verification&rdquo; on the
              sign-in page, then sign in with the password below.
            </>
          )}
        </span>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <KeyRound className="size-3.5" aria-hidden />
          Temporary password
        </p>
        <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5">
          <code className="flex-1 truncate font-mono text-base font-medium tracking-wide text-foreground">
            {created.tempPassword}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copy}
            className="shrink-0 bg-card"
          >
            {copied ? <Check className="text-emerald-600" /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="flex items-start gap-2 rounded-2xl bg-accent/60 px-3 py-2.5 text-xs text-accent-foreground">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Share this with {created.name.split(" ")[0]} now. It won&apos;t be
            shown again, and they should change it after their first sign-in.
          </span>
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCreateAnother}>
          <UserPlus />
          Create another
        </Button>
        <DialogClose asChild>
          <Button type="button">Done</Button>
        </DialogClose>
      </div>
    </>
  );
}
