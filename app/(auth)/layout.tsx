import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, ListChecks, Users } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/session";
import { NexoraGlyph, NexoraMark } from "./_components/nexora-mark";

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Official documents, verifiable",
    body: "Clearances and certificates carry a QR code anyone can check.",
  },
  {
    icon: ListChecks,
    title: "Track every request",
    body: "Follow each filing from submission to release, without a trip to the hall.",
  },
  {
    icon: Users,
    title: "One account, every role",
    body: "Built for the residents and officials of Barangay Libtangin.",
  },
];

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Already signed in? Don't show sign-in/up — send them to their home.
  if (await getSession()) redirect("/start");

  return (
    <>
    <div className="grid min-h-svh content-stretch lg:grid-cols-[1.05fr_1fr]">
      {/* Trust panel: dignified dark surface, amber as accent only (desktop). */}
      <aside
        className="relative hidden overflow-hidden bg-[oklch(0.2_0.012_72)] px-12 py-14 text-[oklch(0.97_0.008_80)] lg:flex lg:flex-col xl:px-16"
        style={{
          backgroundImage:
            "radial-gradient(120% 80% at 15% 0%, oklch(0.27 0.03 75 / 0.55) 0%, transparent 55%)",
        }}
      >
        <NexoraGlyph
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 size-[32rem] text-primary opacity-[0.06]"
        />

        <Link
          href="/"
          className="relative z-10 flex w-fit items-center gap-3 rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
        >
          {/* The lockup's wordmark is dark ink, so on this dark panel the
              emblem pairs with light text instead. */}
          <span className="inline-flex items-center gap-2.5">
            <NexoraGlyph className="size-9" />
            <span className="text-2xl font-semibold tracking-tight">
              Nexora
            </span>
          </span>
          <span aria-hidden className="h-6 w-px bg-white/15" />
          <span className="text-sm leading-tight text-[oklch(0.78_0.012_80)]">
            for Barangay
            <span className="block font-medium text-[oklch(0.97_0.008_80)]">
              Libtangin
            </span>
          </span>
        </Link>

        <div className="relative z-10 mt-auto max-w-md">
          <h2 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight">
            Barangay Libtangin, online.
          </h2>
          <p className="mt-5 max-w-sm text-pretty text-[oklch(0.82_0.012_80)]">
            Register once, then request clearances and certificates from the
            barangay, track each one, and download them when they&apos;re ready.
          </p>

          <ul className="mt-10 flex flex-col gap-6">
            {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/25">
                  <Icon className="size-[1.15rem]" aria-hidden />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="mt-0.5 block text-sm text-[oklch(0.78_0.012_80)]">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-auto pt-14 text-sm text-[oklch(0.68_0.01_80)]">
          Barangay Libtangin, Gasan, Marinduque. Powered by Nexora.
        </p>
      </aside>

      {/* Form column. */}
      <main className="flex flex-col px-5 py-8 sm:px-8">
        {/* Compact brand header on small screens (trust panel is hidden). */}
        <header className="lg:hidden">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2.5 rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          >
            <NexoraMark />
            <span aria-hidden className="h-5 w-px bg-border" />
            <span className="text-sm leading-tight text-muted-foreground">
              for Barangay
              <span className="block font-medium text-foreground">
                Libtangin
              </span>
            </span>
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-3 motion-safe:duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>

    <Toaster position="top-center" richColors />
    </>
  );
}
