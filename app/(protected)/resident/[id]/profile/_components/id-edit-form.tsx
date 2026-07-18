"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { changeResidentId, type ChangeIdInput } from "@/lib/resident-actions";
import { ID_TYPE_OPTIONS } from "@/lib/ids";
import { IdPhotoUpload } from "@/components/id-photo-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/field";

const schema = z.object({
  idType: z.string().min(1, "Choose your ID type."),
  idNumber: z.string().trim().min(1, "Enter your ID number."),
  idFront: z.string().url("Upload the front of your ID."),
  idBack: z.string().url("Upload the back of your ID."),
});

type Values = z.infer<typeof schema>;

export function IdEditForm({
  initial,
  backHref,
}: {
  initial: { idType: string; idNumber: string; idFront: string; idBack: string };
  backHref: string;
}) {
  const router = useRouter();
  const typeId = useId();
  const numberId = useId();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<Values | null>(null);

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
    defaultValues: {
      idType: initial.idType,
      idNumber: initial.idNumber,
      idFront: initial.idFront,
      idBack: initial.idBack,
    },
  });

  const idFront = watch("idFront");
  const idBack = watch("idBack");
  const busy = isSubmitting || confirming;

  const onValid = (values: Values) => {
    setFormError(null);
    setPending(values);
    setConfirmOpen(true);
  };

  const save = async () => {
    const values = pending;
    if (!values) return;
    setConfirming(true);
    const result = await changeResidentId({
      idType: values.idType as ChangeIdInput["idType"],
      idNumber: values.idNumber,
      idFront: values.idFront,
      idBack: values.idBack,
    });
    setConfirming(false);
    if (!result.ok) {
      setFormError(result.error);
      setConfirmOpen(false);
      return;
    }
    toast.success("New ID submitted. The barangay will review it shortly.");
    router.push(backHref);
    router.refresh();
  };

  return (
    <>
      <div className="mb-6 flex items-start gap-2.5 rounded-2xl bg-accent/70 px-4 py-3.5 text-sm text-accent-foreground">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-pretty">
          Replacing your ID sends it back to the barangay for verification. Until
          an official approves the new ID, you won&apos;t be able to request
          documents.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onValid)} noValidate>
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
                  disabled={busy}
                >
                  <SelectTrigger
                    id={typeId}
                    className="w-full"
                    aria-invalid={!!errors.idType}
                  >
                    <SelectValue placeholder="Select an ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {ID_TYPE_OPTIONS.map((t) => (
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
              disabled={busy}
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
              disabled={busy}
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
              disabled={busy}
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
                Use clear, well-lit photos of both sides. JPG or PNG, up to 10 MB
                each.
              </FieldDescription>
            )}
          </Field>

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
              Replace ID
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
            <AlertDialogTitle>Replace ID and re-verify?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the ID on file and sends it back to the barangay for
              review. You won&apos;t be able to request documents until an
              official approves your new ID.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>
              Keep current ID
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void save();
              }}
              disabled={confirming}
            >
              {confirming && <Spinner />}
              Submit new ID
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
