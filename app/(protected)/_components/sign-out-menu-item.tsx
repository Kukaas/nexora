"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
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

/**
 * Sign out from the sidebar footer. Matches the admin and resident menu item,
 * but asks for confirmation first so a stray tap can't end the session.
 */
export function SignOutMenuItem() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async (event: React.MouseEvent) => {
    // Keep the dialog open while the request is in flight so the button can show
    // its loading state instead of vanishing on click.
    event.preventDefault();
    setSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (signingOut) return;
        setOpen(next);
      }}
    >
      <SidebarMenuItem>
        <AlertDialogTrigger asChild>
          <SidebarMenuButton tooltip="Sign out">
            <LogOut />
            <span>Sign out</span>
          </SidebarMenuButton>
        </AlertDialogTrigger>
      </SidebarMenuItem>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to sign in again to get back to the treasury.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={signingOut}>Stay signed in</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut && <Spinner />}
            {signingOut ? "Signing out…" : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
