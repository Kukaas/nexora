"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SignOutButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async (event: React.MouseEvent) => {
    // Keep the dialog open while the request is in flight so the button can
    // show its loading state instead of vanishing on click.
    event.preventDefault();
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Don't let an outside click dismiss the dialog mid-request.
        if (isSigningOut) return;
        setOpen(next);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" className="w-fit">
          Sign out
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to sign in again to get back to your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSigningOut}>Stay signed in</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={signOut}
            disabled={isSigningOut}
          >
            {isSigningOut && <Spinner />}
            {isSigningOut ? "Signing out..." : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
