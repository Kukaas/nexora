"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { NexoraGlyph } from "@/app/(auth)/_components/nexora-mark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import type { AdminUser } from "./admin-shell";
import { SignOutMenuItem } from "../../_components/sign-out-menu-item";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only mark active on an exact path match (for index routes like /admin). */
  exact?: boolean;
};

const MANAGE: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/officials", label: "Officials", icon: ShieldCheck },
  { href: "/admin/residents", label: "Residents", icon: UsersRound },
  { href: "/messages", label: "Messages", icon: MessagesSquare },
];

export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar>
      <SidebarHeader className="gap-0 px-3 pt-4">
        <Link
          href="/admin"
          onClick={closeOnMobile}
          className="flex items-center gap-2.5 rounded-2xl px-1 py-1 outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/40"
        >
          <NexoraGlyph className="size-8 text-primary" />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">Nexora</span>
            <span className="text-xs text-muted-foreground">Admin console</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MANAGE.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.exact)}
                    tooltip={item.label}
                  >
                    <Link href={item.href} onClick={closeOnMobile}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/admin/activity")}
                  tooltip="Activity log"
                >
                  <Link href="/admin/activity" onClick={closeOnMobile}>
                    <Activity />
                    <span>Activity log</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton aria-disabled tooltip="Settings">
                  <Settings />
                  <span>Settings</span>
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
                <span className="truncate text-sm font-medium">{user.name}</span>
                <Badge
                  variant="secondary"
                  className="mt-0.5 w-fit gap-1 px-1.5 text-[0.6875rem] font-medium"
                >
                  <ShieldCheck className="size-3" aria-hidden />
                  Administrator
                </Badge>
              </div>
            </div>
          </SidebarMenuItem>
          <SignOutMenuItem />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
