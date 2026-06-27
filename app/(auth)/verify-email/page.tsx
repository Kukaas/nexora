import type { Metadata } from "next";
import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";
import { VerifyEmailForm } from "../_components/verify-email-form";

export const metadata: Metadata = {
  title: "Verify your email · Barangay Libtangin",
  description: "Confirming your email address for Barangay Libtangin on Nexora.",
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
