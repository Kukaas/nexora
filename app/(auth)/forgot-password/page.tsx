import type { Metadata } from "next";

import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Nexora - Reset Password",
  description: "Request a link to reset your Nexora password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
