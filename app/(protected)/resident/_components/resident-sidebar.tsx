"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FilePlus2,
  FileText,
  Landmark,
  LayoutDashboard,
  Megaphone,
  UserRound,
} from "lucide-react";

import { NexoraGlyph } from "@/app/(auth)/_components/nexora-mark";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { ResidentUser } from "./resident-shell";
import { SignOutMenuItem } from "../../_components/sign-out-menu-item";

export function ResidentSidebar({
  user,
  actionNeeded,
}: {
  user: ResidentUser;
  actionNeeded: number;
}) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const home = `/resident/${user.id}`;

  // On a phone the sidebar is a sheet; jumping to an in-page section should
  // close it so the content is actually visible.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader className="gap-0 px-3 pt-4">
        <Link
          href={home}
          onClick={closeOnMobile}
          className="flex items-center gap-2.5 rounded-2xl px-1 py-1 outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/40"
        >
          <NexoraGlyph className="size-8 text-primary" />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">
              Nexora
            </span>
            <span className="text-xs text-muted-foreground">
              Barangay Libtangin
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === home}
                  tooltip="Overview"
                >
                  <Link href={home} onClick={closeOnMobile}>
                    <LayoutDashboard />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Announcements">
                  <a href="#announcements" onClick={closeOnMobile}>
                    <Megaphone />
                    <span>Announcements</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="My requests">
                  <a href="#my-requests" onClick={closeOnMobile}>
                    <FileText />
                    <span>My requests</span>
                  </a>
                </SidebarMenuButton>
                {actionNeeded > 0 && (
                  <SidebarMenuBadge className="text-destructive">
                    {actionNeeded}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Services</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Request a document">
                  <a href="#request" onClick={closeOnMobile}>
                    <FilePlus2 />
                    <span>Request a document</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton aria-disabled tooltip="Barangay officials">
                  <Landmark />
                  <span>Barangay officials</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-muted-foreground">
                  Soon
                </SidebarMenuBadge>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton aria-disabled tooltip="My profile">
                  <UserRound />
                  <span>My profile</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="text-muted-foreground">
                  Soon
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 rounded-2xl px-2 py-2">
              <Avatar>
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SignOutMenuItem />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
