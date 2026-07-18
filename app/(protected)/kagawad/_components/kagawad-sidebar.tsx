"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  UsersRound,
} from "lucide-react";

import { NexoraGlyph } from "@/app/(auth)/_components/nexora-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { KagawadUser } from "./kagawad-shell";
import { SignOutMenuItem } from "../../_components/sign-out-menu-item";

export function KagawadSidebar({ user }: { user: KagawadUser }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const home = `/kagawad/${user.id}`;
  const announcements = `${home}/announcements`;
  const residents = `${home}/residents`;

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
            <span className="text-base font-semibold tracking-tight">Nexora</span>
            <span className="text-xs text-muted-foreground">
              Barangay Libtangin
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>
            {user.purokLabel ? `Kagawad · ${user.purokLabel}` : "Kagawad"}
          </SidebarGroupLabel>
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
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(announcements)}
                  tooltip="Purok announcements"
                >
                  <Link href={announcements} onClick={closeOnMobile}>
                    <Megaphone />
                    <span>Announcements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(residents)}
                  tooltip="Purok residents"
                >
                  <Link href={residents} onClick={closeOnMobile}>
                    <UsersRound />
                    <span>Residents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/messages")}
                  tooltip="Resident messages"
                >
                  <Link href="/messages" onClick={closeOnMobile}>
                    <MessagesSquare />
                    <span>Messages</span>
                  </Link>
                </SidebarMenuButton>
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
                <span className="truncate text-sm font-medium">{user.name}</span>
                {user.purokLabel && (
                  <span className="truncate text-xs text-muted-foreground">
                    {user.purokLabel}
                  </span>
                )}
              </div>
            </div>
          </SidebarMenuItem>
          <SignOutMenuItem />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
