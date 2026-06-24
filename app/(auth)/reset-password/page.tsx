import type { Metadata } from "next";
import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";
import { ResetPasswordForm } from "../_components/reset-password-form";

export const metadata: Metadata = {
  title: "Nexora - Set New Password",
  description: "Choose a new password for your Nexora account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
