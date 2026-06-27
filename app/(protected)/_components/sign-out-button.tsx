"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={signOut}
      disabled={isSigningOut}
      className="w-fit"
    >
      {isSigningOut && <Spinner />}
      {isSigningOut ? "Signing out..." : "Sign out"}
    </Button>
  );
}
