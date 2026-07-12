"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  resubmitResidentId,
  type ResubmitIdInput,
} from "@/lib/resident-actions";
import { IdPhotoUpload } from "@/components/id-photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/field";

const ID_TYPES = [
  { value: "DRIVER_LICENSE", label: "Driver's license" },
  { value: "PASSPORT", label: "Passport" },
  { value: "SSS", label: "SSS ID" },
  { value: "GSIS", label: "GSIS ID" },
  { value: "PRC", label: "PRC ID" },
  { value: "OTHERS", label: "Other government ID" },
] as const;

const schema = z.object({
  idType: z.string().min(1, "Choose your ID type."),
  idNumber: z.string().trim().min(1, "Enter your ID number."),
  idFront: z.string().url("Upload the front of your ID."),
  idBack: z.string().url("Upload the back of your ID."),
});

type Values = z.infer<typeof schema>;

export function ResubmitIdForm() {
  const router = useRouter();
  const typeId = useId();
  const numberId = useId();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { idType: "", idNumber: "", idFront: "", idBack: "" },
  });

  const idFront = watch("idFront");
  const idBack = watch("idBack");

  const onSubmit = async (values: Values) => {
    setFormError(null);
    const result = await resubmitResidentId({
      idType: values.idType as ResubmitIdInput["idType"],
      idNumber: values.idNumber,
      idFront: values.idFront,
      idBack: values.idBack,
    });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast.success("New ID submitted. The barangay will review it shortly.");
    router.push("/resident");
    router.refresh();
  };

  return (
    <Card>
      <CardContent className="pt-6">
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
            <Field data-invalid={!!errors.idType}>
              <FieldLabel htmlFor={typeId}>ID type</FieldLabel>
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
                      id={typeId}
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
              {errors.idType && <FieldError>{errors.idType.message}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.idNumber}>
              <FieldLabel htmlFor={numberId}>ID number</FieldLabel>
              <Input
                id={numberId}
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

            <Field data-invalid={!!errors.idFront}>
              <FieldLabel>Front of your ID</FieldLabel>
              <IdPhotoUpload
                value={idFront}
                emptyLabel="Add the front"
                alt="Front of your ID"
                disabled={isSubmitting}
                onUploaded={(url) => {
                  setValue("idFront", url, { shouldValidate: true });
                  clearErrors("idFront");
                }}
                onError={() =>
                  toast.error("Upload didn't finish. Please try again.")
                }
              />
              {errors.idFront && (
                <FieldError>{errors.idFront.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.idBack}>
              <FieldLabel>Back of your ID</FieldLabel>
              <IdPhotoUpload
                value={idBack}
                emptyLabel="Add the back"
                alt="Back of your ID"
                disabled={isSubmitting}
                onUploaded={(url) => {
                  setValue("idBack", url, { shouldValidate: true });
                  clearErrors("idBack");
                }}
                onError={() =>
                  toast.error("Upload didn't finish. Please try again.")
                }
              />
              {errors.idBack ? (
                <FieldError>{errors.idBack.message}</FieldError>
              ) : (
                <FieldDescription>
                  Use clear, well-lit photos of both sides. JPG or PNG, up to
                  10 MB each.
                </FieldDescription>
              )}
            </Field>

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Spinner /> : <RefreshCw />}
              {isSubmitting ? "Submitting..." : "Submit for review"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
