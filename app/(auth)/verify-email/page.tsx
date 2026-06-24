import type { Metadata } from "next";
import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";
import { VerifyEmailForm } from "../_components/verify-email-form";

export const metadata: Metadata = {
  title: "Nexora - Verify Email",
  description: "Confirming your Nexora email address.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
