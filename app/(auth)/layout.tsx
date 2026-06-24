import Link from "next/link";
import { ShieldCheck, ListChecks, Users } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
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
    body: "Built for residents and for barangay officials who serve them.",
  },
];

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
          className="relative z-10 w-fit rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
        >
          <NexoraMark wordClassName="text-2xl" />
        </Link>

        <div className="relative z-10 mt-auto max-w-md">
          <h2 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight">
            Your barangay, online.
          </h2>
          <p className="mt-5 max-w-sm text-pretty text-[oklch(0.82_0.012_80)]">
            Register once, then request clearances and certificates, track each
            one, and pick them up or download them when they&apos;re ready.
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
          A digital barangay services platform.
        </p>
      </aside>

      {/* Form column. */}
      <main className="flex flex-col px-5 py-8 sm:px-8">
        {/* Compact brand header on small screens (trust panel is hidden). */}
        <header className="lg:hidden">
          <Link
            href="/"
            className="inline-flex w-fit rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
          >
            <NexoraMark />
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
