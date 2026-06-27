import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  ShieldCheck,
  UserPlus,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { UserRoles } from "@/app/generated/prisma/enums";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOfficialDialog } from "./_components/create-official-dialog";
import { RoleBadge } from "./_components/role-badge";
import {
  OFFICIAL_ROLES,
  displayName,
  formatRelative,
  initialsOf,
  primaryRole,
} from "./_data";

export const metadata: Metadata = {
  title: "Overview · Admin · Barangay Libtangin",
};

export default async function AdminOverviewPage() {
  const session = await getSession();
  const adminFirstName =
    (session?.user as { firstName?: string | null } | undefined)?.firstName ||
    session?.user?.name?.split(" ")[0] ||
    "Admin";

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    officialsCount,
    residentsCount,
    pendingSetup,
    newThisWeek,
    officials,
    recent,
  ] = await Promise.all([
    prisma.user.count({ where: { roles: { hasSome: OFFICIAL_ROLES } } }),
    prisma.user.count({ where: { roles: { has: UserRoles.RESIDENT } } }),
    prisma.user.count({
      where: { roles: { has: UserRoles.RESIDENT }, profileCompletedAt: null },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.findMany({
      where: { roles: { hasSome: OFFICIAL_ROLES } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true,
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        roles: true,
        createdAt: true,
      },
    }),
  ]);

  const stats = [
    { label: "Officials", value: officialsCount, icon: ShieldCheck },
    { label: "Residents", value: residentsCount, icon: UsersRound },
    {
      label: "Awaiting setup",
      value: pendingSetup,
      icon: Clock,
      attention: pendingSetup > 0,
    },
    { label: "New this week", value: newThisWeek, icon: UserRoundCheck },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Welcome back, {adminFirstName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage official accounts and keep an eye on the barangay registry.
        </p>
      </header>

      <section
        aria-label="Summary"
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-3xl border border-border bg-card p-5 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-2xl",
                s.attention
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <s.icon className="size-4.5" aria-hidden />
            </span>
            <p
              className={cn(
                "mt-3 text-3xl font-semibold tracking-tight tabular-nums",
                s.attention ? "text-accent-foreground" : "text-foreground",
              )}
            >
              {s.value}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              Officials
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="-mr-1.5 text-muted-foreground"
              >
                <Link href="/admin/officials">
                  Manage
                  <ArrowRight />
                </Link>
              </Button>
            </CardTitle>
            <CardDescription>
              Accounts that can sign in to run the barangay.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="-my-1 divide-y divide-border">
              {officials.map((o) => {
                const name = displayName(o);
                return (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {initialsOf(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">
                          {o.email}
                        </p>
                      </div>
                    </div>
                    <RoleBadge role={primaryRole(o.roles)} className="shrink-0" />
                  </li>
                );
              })}
            </ul>
          </CardContent>
          <CardFooter>
            <CreateOfficialDialog className="w-full" size="lg">
              <UserPlus />
              Create official account
            </CreateOfficialDialog>
          </CardFooter>
        </Card>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                Recent accounts
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="-mr-1.5 text-muted-foreground"
                >
                  <Link href="/admin/activity">
                    All activity
                    <ArrowRight />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3.5">
                {recent.map((u) => {
                  const name = displayName(u);
                  const role = primaryRole(u.roles);
                  const isOfficial = role !== UserRoles.RESIDENT;
                  return (
                    <li key={u.id} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                          isOfficial
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isOfficial ? (
                          <ShieldCheck className="size-3.5" aria-hidden />
                        ) : (
                          <UserPlus className="size-3.5" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{name}</span>{" "}
                          <span className="text-muted-foreground">joined</span>
                        </p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatRelative(u.createdAt)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
