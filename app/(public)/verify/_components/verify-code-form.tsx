"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

/**
 * Manual fallback for the QR code: someone holding a printed document but no
 * working camera can type the verification code instead. This only navigates to
 * `/verify/<code>` — that route is what resolves the code against the database,
 * so nothing here can reveal whether a code exists.
 */
const CODE_LENGTH = 16;

/**
 * Pull the code out of whatever was pasted. Accepts the bare code, a full
 * verification URL, and codes typed with spaces or dashes for readability.
 * Codes are Crockford base32, so lowercase input is simply uppercased.
 */
function normalizeCode(raw: string): string {
  const withoutUrl = raw.trim().replace(/^.*\/verify\//i, "");
  return withoutUrl.replace(/[^0-9a-z]/gi, "").toUpperCase();
}

const schema = z.object({
  code: z
    .string()
    .transform(normalizeCode)
    .refine((code) => code.length > 0, {
      message: "Enter the verification code printed on the document.",
    })
    .refine((code) => code.length === CODE_LENGTH, {
      message: `Verification codes are ${CODE_LENGTH} characters long. Check for a missed or extra character.`,
    }),
});

type Values = z.input<typeof schema>;

export function VerifyCodeForm() {
  const router = useRouter();
  const codeId = useId();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "" } as Values,
  });

  const onSubmit = handleSubmit((values) => {
    router.push(`/verify/${values.code}`);
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <Field data-invalid={errors.code ? true : undefined}>
          <FieldLabel htmlFor={codeId}>Verification code</FieldLabel>
          <FieldDescription>
            {CODE_LENGTH} letters and numbers, printed beside the QR code. You
            can also paste the whole link.
          </FieldDescription>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id={codeId}
              placeholder="e.g. 7HQ2K9MJ4TXP0V3B"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={errors.code ? true : undefined}
              className="h-12 font-mono text-base uppercase tracking-wider sm:flex-1"
              {...register("code")}
            />
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-12 px-6 text-base"
            >
              <Search aria-hidden />
              Verify
              <ArrowRight aria-hidden />
            </Button>
          </div>
          {errors.code ? <FieldError>{errors.code.message}</FieldError> : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
