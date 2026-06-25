import type { Metadata } from "next";

import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset password · Barangay Libtangin",
  description: "Request a link to reset your Barangay Libtangin account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
