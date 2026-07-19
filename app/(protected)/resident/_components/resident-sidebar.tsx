"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FilePlus2,
  FileText,
  Landmark,
  LayoutDashboard,
  Lock,
  Megaphone,
  MessagesSquare,
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
  messagesUnread,
  verified,
}: {
  user: ResidentUser;
  actionNeeded: number;
  messagesUnread: boolean;
  /** When false, the "Request a document" item is locked until an official
   * approves the resident's ID. */
  verified: boolean;
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
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(`${home}/announcements`)}
                  tooltip="Announcements"
                >
                  <Link href={`${home}/announcements`} onClick={closeOnMobile}>
                    <Megaphone />
                    <span>Announcements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(`${home}/messages`)}
                  tooltip="Messages"
                >
                  <Link href={`${home}/messages`} onClick={closeOnMobile}>
                    <MessagesSquare />
                    <span>Messages</span>
                  </Link>
                </SidebarMenuButton>
                {messagesUnread && (
                  <SidebarMenuBadge className="text-primary">
                    <span
                      className="size-2 rounded-full bg-primary"
                      aria-label="Unread messages"
                    />
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(`${home}/requests`)}
                  tooltip="My requests"
                >
                  <Link href={`${home}/requests`} onClick={closeOnMobile}>
                    <FileText />
                    <span>My requests</span>
                  </Link>
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
                {verified ? (
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === `${home}/request` ||
                      pathname.startsWith(`${home}/request/`)
                    }
                    tooltip="Request a document"
                  >
                    <Link href={`${home}/request`} onClick={closeOnMobile}>
                      <FilePlus2 />
                      <span>Request a document</span>
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  // Locked until an official approves the resident's ID. Rendered
                  // as a disabled button (not a link) so it can't be navigated to,
                  // with a tooltip explaining why.
                  <SidebarMenuButton
                    disabled
                    aria-disabled
                    tooltip="Verify your ID first to request documents"
                    className="cursor-not-allowed"
                  >
                    <FilePlus2 />
                    <span>Request a document</span>
                    <Lock className="ml-auto size-3.5 text-muted-foreground" />
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(`${home}/officials`)}
                  tooltip="Barangay officials"
                >
                  <Link href={`${home}/officials`} onClick={closeOnMobile}>
                    <Landmark />
                    <span>Barangay officials</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(`${home}/profile`)}
                  tooltip="My profile"
                >
                  <Link href={`${home}/profile`} onClick={closeOnMobile}>
                    <UserRound />
                    <span>My profile</span>
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
