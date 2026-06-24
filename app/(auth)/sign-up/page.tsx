import type { Metadata } from "next";

import { SignUpForm } from "../_components/sign-up-form";

export const metadata: Metadata = {
  title: "Nexora - Create Account",
  description: "Register for a Nexora barangay services account.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
