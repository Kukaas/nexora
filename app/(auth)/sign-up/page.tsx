import type { Metadata } from "next";

import { SignUpForm } from "../_components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account · Barangay Libtangin",
  description:
    "Register to request documents from Barangay Libtangin, Gasan, Marinduque, on Nexora.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
