import type { Metadata } from "next";

import { SignInForm } from "../_components/sign-in-form";

export const metadata: Metadata = {
  title: "Nexora - Sign In",
  description: "Sign in to your account"
};

export default function SignInPage() {
  return <SignInForm />;
}
