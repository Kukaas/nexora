import type { Metadata } from "next";
import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";
import { JsonLd, breadcrumbLd, graph } from "@/app/_components/json-ld";
import { SignInForm } from "../_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in · Barangay Libtangin",
  description: "Sign in to your Barangay Libtangin account on Nexora."
};

export default function SignInPage() {
  // SignInForm reads `?error=` via useSearchParams, which requires a Suspense
  // boundary so the rest of the route can still prerender.
  return (
    <>
      <JsonLd data={graph(breadcrumbLd([{ name: "Sign in", path: "/sign-in" }]))} />
      <Suspense
        fallback={
          <div className="flex justify-center py-10">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        }
      >
        <SignInForm />
      </Suspense>
    </>
  );
}
