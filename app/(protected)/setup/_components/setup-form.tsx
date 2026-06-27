"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { completeResidentSetup, type SetupInput } from "@/lib/resident-actions";
import { cn } from "@/lib/utils";
import { IdPhotoUpload } from "@/components/id-photo-upload";
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

const ID_TYPES = [
  { value: "DRIVER_LICENSE", label: "Driver's license" },
  { value: "PASSPORT", label: "Passport" },
  { value: "SSS", label: "SSS ID" },
  { value: "GSIS", label: "GSIS ID" },
  { value: "PRC", label: "PRC ID" },
  { value: "OTHERS", label: "Other government ID" },
] as const;

const PH_MOBILE = /^(09\d{9}|\+?639\d{8})$/;

const setupSchema = z.object({
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
  idType: z.string().min(1, "Choose your ID type."),
  idNumber: z.string().trim().min(1, "Enter your ID number."),
  idImage: z.string().url("Upload a photo of your ID."),
});

type SetupValues = z.infer<typeof setupSchema>;

export function SetupForm({ email }: { email: string }) {
  const router = useRouter();
  const ids = {
    firstName: useId(),
    middleName: useId(),
    lastName: useId(),
    birthDate: useId(),
    mobile: useId(),
    idType: useId(),
    idNumber: useId(),
  };

  const [formError, setFormError] = useState<string | null>(null);
  const [dobOpen, setDobOpen] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      birthDate: undefined,
      mobileNumber: "",
      idType: "",
      idNumber: "",
      idImage: "",
    },
  });

  useEffect(() => {
    if (formError) alertRef.current?.focus();
  }, [formError]);

  const idImage = watch("idImage");

  const onSubmit = async (values: SetupValues) => {
    setFormError(null);
    const payload: SetupInput = {
      ...values,
      birthDate: format(values.birthDate, "yyyy-MM-dd"),
      idType: values.idType as SetupInput["idType"],
    };
    const result = await completeResidentSetup(payload);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast.success("Profile submitted. The barangay will verify your ID.");
    router.push("/resident");
    router.refresh();
  };

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Complete your profile
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          A few details for{" "}
          <span className="font-medium text-foreground break-all">{email}</span>,
          so the barangay can verify your account.
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
          {/* Name */}
          <FieldSet>
            <FieldLegend variant="label">Your name</FieldLegend>
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor={ids.firstName}>First name</FieldLabel>
              <Input
                id={ids.firstName}
                autoComplete="given-name"
                autoFocus
                aria-invalid={!!errors.firstName}
                disabled={isSubmitting}
                placeholder="Juan"
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
                disabled={isSubmitting}
                placeholder="Santos"
                {...register("middleName")}
              />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor={ids.lastName}>Last name</FieldLabel>
              <Input
                id={ids.lastName}
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                disabled={isSubmitting}
                placeholder="Dela Cruz"
                {...register("lastName")}
              />
              {errors.lastName && (
                <FieldError>{errors.lastName.message}</FieldError>
              )}
            </Field>
          </FieldSet>

          {/* Personal details */}
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
                        disabled={isSubmitting}
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
                disabled={isSubmitting}
                placeholder="0917 123 4567"
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

          {/* Government ID */}
          <FieldSet>
            <FieldLegend variant="label">Government ID</FieldLegend>
            <Field data-invalid={!!errors.idType}>
              <FieldLabel htmlFor={ids.idType}>ID type</FieldLabel>
              <Controller
                control={control}
                name="idType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id={ids.idType}
                      className="w-full"
                      aria-invalid={!!errors.idType}
                    >
                      <SelectValue placeholder="Select an ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.idType && (
                <FieldError>{errors.idType.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.idNumber}>
              <FieldLabel htmlFor={ids.idNumber}>ID number</FieldLabel>
              <Input
                id={ids.idNumber}
                className="font-mono"
                aria-invalid={!!errors.idNumber}
                disabled={isSubmitting}
                placeholder="N01-23-456789"
                {...register("idNumber")}
              />
              {errors.idNumber && (
                <FieldError>{errors.idNumber.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.idImage}>
              <FieldLabel>Photo of your ID</FieldLabel>
              <IdPhotoUpload
                value={idImage}
                disabled={isSubmitting}
                onUploaded={(url) => {
                  setValue("idImage", url, { shouldValidate: true });
                  clearErrors("idImage");
                }}
                onError={() =>
                  toast.error("Upload didn't finish. Please try again.")
                }
              />
              {errors.idImage ? (
                <FieldError>{errors.idImage.message}</FieldError>
              ) : (
                <FieldDescription>
                  Use a clear, well-lit photo. JPG or PNG, up to 10 MB.
                </FieldDescription>
              )}
            </Field>
          </FieldSet>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Submitting..." : "Submit for verification"}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
