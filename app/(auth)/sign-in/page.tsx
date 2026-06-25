import type { Metadata } from "next";

import { SignInForm } from "../_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in · Barangay Libtangin",
  description: "Sign in to your Barangay Libtangin account on Nexora."
};

export default function SignInPage() {
  return <SignInForm />;
}
