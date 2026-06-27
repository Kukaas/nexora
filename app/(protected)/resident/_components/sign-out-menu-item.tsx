"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SignOutMenuItem() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={signOut}
        disabled={signingOut}
        tooltip="Sign out"
      >
        {signingOut ? <Spinner /> : <LogOut />}
        <span>{signingOut ? "Signing out…" : "Sign out"}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
