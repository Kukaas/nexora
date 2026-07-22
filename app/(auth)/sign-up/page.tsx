import type { Metadata } from "next";

import { JsonLd, breadcrumbLd, graph } from "@/app/_components/json-ld";
import { SignUpForm } from "../_components/sign-up-form";

export const metadata: Metadata = {
  title: "Create account · Barangay Libtangin",
  description:
    "Register to request documents from Barangay Libtangin, Gasan, Marinduque, on Nexora.",
};

export default function SignUpPage() {
  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Create account", path: "/sign-up" }]))} />
      <SignUpForm />
    </>
  );
}
