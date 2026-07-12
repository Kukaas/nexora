"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { AlertCircle, CalendarIcon, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  updateResidentProfile,
  type UpdateProfileInput,
} from "@/lib/resident-actions";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/avatar-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";

const PH_MOBILE = /^(09\d{9}|\+?639\d{8})$/;

const schema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, "Enter your last name."),
  birthDate: z
    .date({ message: "Select your date of birth." })
    .max(new Date(), "Date of birth can't be in the future."),
  mobileNumber: z
    .string()
    .trim()
    .min(1, "Enter your mobile number.")
    .refine(
      (v) => PH_MOBILE.test(v.replace(/[\s\-()]/g, "")),
      "Enter a valid PH mobile number, e.g. 0917 123 4567.",
    ),
});

type Values = z.infer<typeof schema>;

export type ProfileInitial = {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string | null;
  mobileNumber: string;
  image: string | null;
};

const norm = (v: string) => v.trim().toLowerCase();

export function ProfileForm({
  initial,
  initials,
  residencyApproved,
  backHref,
}: {
  initial: ProfileInitial;
  initials: string;
  residencyApproved: boolean;
  backHref: string;
}) {
  const router = useRouter();
  const ids = {
    firstName: useId(),
    middleName: useId(),
    lastName: useId(),
    birthDate: useId(),
    mobile: useId(),
  };

  const [avatar, setAvatar] = useState<string | null>(initial.image);
  const [formError, setFormError] = useState<string | null>(null);
  const [dobOpen, setDobOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<Values | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: initial.firstName,
      middleName: initial.middleName,
      lastName: initial.lastName,
      birthDate: initial.birthDate ? new Date(initial.birthDate) : undefined,
      mobileNumber: initial.mobileNumber,
    },
  });

  useEffect(() => {
    if (formError) alertRef.current?.focus();
  }, [formError]);

  const legalNameChanged = (v: Values) =>
    norm(v.firstName) !== norm(initial.firstName) ||
    norm(v.middleName ?? "") !== norm(initial.middleName) ||
    norm(v.lastName) !== norm(initial.lastName);

  const save = async (values: Values) => {
    setFormError(null);
    const payload: UpdateProfileInput = {
      firstName: values.firstName,
      middleName: values.middleName,
      lastName: values.lastName,
      birthDate: format(values.birthDate, "yyyy-MM-dd"),
      mobileNumber: values.mobileNumber,
      image: avatar,
    };
    const result = await updateResidentProfile(payload);
    if (!result.ok) {
      setFormError(result.error);
      setConfirmOpen(false);
      return;
    }
    toast.success(
      result.reverified
        ? "Profile saved. Your ID goes back for verification."
        : "Profile saved.",
    );
    router.push(backHref);
    router.refresh();
  };

  const onValid = async (values: Values) => {
    // Changing the legal name on a verified account re-opens ID verification;
    // confirm that consequence before saving.
    if (residencyApproved && legalNameChanged(values)) {
      setPending(values);
      setConfirmOpen(true);
      return;
    }
    await save(values);
  };

  const runConfirmed = async () => {
    if (!pending) return;
    setConfirming(true);
    await save(pending);
    setConfirming(false);
  };

  const busy = isSubmitting || confirming;

  return (
    <>
      {formError && (
        <div
          ref={alertRef}
          role="alert"
          tabIndex={-1}
          className="mb-6 flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive outline-none"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onValid)} noValidate>
        <FieldGroup>
          <FieldSet>
            <FieldLegend variant="label">Profile photo</FieldLegend>
            <AvatarUpload
              value={avatar}
              initials={initials}
              disabled={busy}
              onChange={setAvatar}
              onError={() => toast.error("Upload didn't finish. Please try again.")}
            />
          </FieldSet>

          <FieldSet>
            <FieldLegend variant="label">Your name</FieldLegend>
            {residencyApproved && (
              <p className="flex items-start gap-2 rounded-2xl bg-accent/60 px-3.5 py-2.5 text-xs text-accent-foreground text-pretty">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Changing your first, middle, or last name sends your account
                  back for ID verification, so you won&apos;t be able to request
                  documents until an official approves it. Editing your photo,
                  birth date, or mobile number won&apos;t.
                </span>
              </p>
            )}
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor={ids.firstName}>First name</FieldLabel>
              <Input
                id={ids.firstName}
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                disabled={busy}
                {...register("firstName")}
              />
              {errors.firstName && (
                <FieldError>{errors.firstName.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.middleName}>
              <FieldLabel htmlFor={ids.middleName}>
                Middle name{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FieldLabel>
              <Input
                id={ids.middleName}
                autoComplete="additional-name"
                disabled={busy}
                {...register("middleName")}
              />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor={ids.lastName}>Last name</FieldLabel>
              <Input
                id={ids.lastName}
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                disabled={busy}
                {...register("lastName")}
              />
              {errors.lastName && (
                <FieldError>{errors.lastName.message}</FieldError>
              )}
            </Field>
          </FieldSet>

          <FieldSet>
            <FieldLegend variant="label">Personal details</FieldLegend>
            <Field data-invalid={!!errors.birthDate}>
              <FieldLabel htmlFor={ids.birthDate}>Date of birth</FieldLabel>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <Popover open={dobOpen} onOpenChange={setDobOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id={ids.birthDate}
                        type="button"
                        variant="outline"
                        disabled={busy}
                        aria-invalid={!!errors.birthDate}
                        className={cn(
                          "h-9 w-full justify-start rounded-3xl bg-input/50 px-3 font-normal hover:bg-input/50",
                          !field.value && "text-muted-foreground",
                          errors.birthDate &&
                            "border-destructive ring-3 ring-destructive/20",
                        )}
                      >
                        <CalendarIcon
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                        {field.value
                          ? format(field.value, "PPP")
                          : "Select your date of birth"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setDobOpen(false);
                        }}
                        captionLayout="dropdown"
                        startMonth={new Date(1920, 0)}
                        endMonth={new Date()}
                        defaultMonth={field.value ?? new Date(2000, 0)}
                        disabled={{ after: new Date() }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.birthDate && (
                <FieldError>{errors.birthDate.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.mobileNumber}>
              <FieldLabel htmlFor={ids.mobile}>Mobile number</FieldLabel>
              <Input
                id={ids.mobile}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={!!errors.mobileNumber}
                disabled={busy}
                {...register("mobileNumber")}
              />
              {errors.mobileNumber ? (
                <FieldError>{errors.mobileNumber.message}</FieldError>
              ) : (
                <FieldDescription>
                  We&apos;ll text you here about your requests.
                </FieldDescription>
              )}
            </Field>
          </FieldSet>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={busy}
              onClick={() => router.push(backHref)}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={busy}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </FieldGroup>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-accent text-accent-foreground">
              <ShieldAlert />
            </AlertDialogMedia>
            <AlertDialogTitle>Change your name and re-verify?</AlertDialogTitle>
            <AlertDialogDescription>
              Your legal name is tied to your verified ID. Saving a new name
              sends your account back to the barangay for verification, and you
              won&apos;t be able to request documents until an official approves
              it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void runConfirmed();
              }}
              disabled={confirming}
            >
              {confirming && <Spinner />}
              Save and re-verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
