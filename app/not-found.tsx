import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileQuestion, ScanLine, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NexoraGlyph, NexoraMark } from "@/app/(auth)/_components/nexora-mark";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for could not be found on Nexora.",
  robots: { index: false, follow: true },
};

// Where a lost visitor most likely meant to go — mirrors the homepage anchors
// and the public auth pages.
const SUGGESTIONS = [
  { href: "/sign-up", label: "Create an account" },
  { href: "/sign-in", label: "Sign in" },
  { href: "/#verify", label: "Verify a document" },
];

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 45% at 75% 0%, oklch(0.962 0.03 90 / 0.7) 0%, transparent 60%)",
        }}
      />
      <NexoraGlyph
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 -z-10 w-[30rem] max-w-none opacity-[0.035]"
      />

      {/* Slim brand header, matching the site. */}
      <header className="mx-auto flex h-16 w-full max-w-6xl shrink-0 items-center px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Nexora, for Barangay Libtangin"
          className="flex items-center gap-3 rounded-3xl outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
        >
          <NexoraMark />
          <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-sm leading-tight text-muted-foreground sm:block">
            for Barangay
            <span className="block font-medium text-foreground">Libtangin</span>
          </span>
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 py-14 sm:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Message column. */}
          <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground ring-1 ring-primary/15">
              <SearchX className="size-4 text-primary" aria-hidden />
              Error 404
            </span>

            <h1 className="mt-6 text-balance text-[clamp(2.25rem,5.5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
              We couldn&rsquo;t find that page.
            </h1>

            <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
              The link may be broken or the page may have moved. Nothing was lost
              — let&rsquo;s get you back to Barangay Libtangin&rsquo;s services.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link href="/">
                  Back to home
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>Try instead:</span>
              {SUGGESTIONS.map((s, i) => (
                <span key={s.href} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-border">·</span>}
                  <Link
                    href={s.href}
                    className="font-medium text-foreground underline-offset-4 outline-none hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline"
                  >
                    {s.label}
                  </Link>
                </span>
              ))}
            </div>
          </div>

          {/* Thematic artifact: Nexora's verification card, in a "not found"
              state. Ties the error to what the product actually does. */}
          <NotFoundArtifact />
        </div>
      </div>
    </main>
  );
}

function NotFoundArtifact() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mr-0">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 -top-14 select-none font-mono text-[7rem] font-bold leading-none tracking-[-0.06em] text-primary/40 sm:-right-6 sm:text-[9rem]"
      >
        404
      </span>

      <div className="relative rounded-4xl border border-border bg-card p-7 shadow-lg shadow-foreground/5 ring-1 ring-foreground/5 sm:p-8">
        <NexoraGlyph
          aria-hidden
          className="pointer-events-none absolute right-5 top-5 size-24 text-primary opacity-[0.06]"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-[oklch(0.6_0.17_25)]/12 text-[oklch(0.52_0.17_25)]">
              <FileQuestion className="size-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-semibold tracking-tight">Page not found</p>
              <p className="text-sm text-muted-foreground">No matching record</p>
            </div>
          </div>
          <div className="grid size-14 place-items-center rounded-xl border border-dashed border-border bg-background text-muted-foreground">
            <ScanLine className="size-6 opacity-50" aria-hidden />
          </div>
        </div>

        <div className="my-6 h-px bg-border" />

        <dl className="divide-y divide-border text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Requested</dt>
            <dd className="font-mono font-medium text-muted-foreground line-through">
              /unknown
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Reference no.</dt>
            <dd className="font-mono font-medium tracking-widest text-muted-foreground">
              — — —
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.6_0.17_25)]/12 px-2.5 py-1 text-xs font-semibold text-[oklch(0.52_0.17_25)]">
                Not found
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-muted-foreground">Barangay</dt>
            <dd className="font-medium tracking-tight">Libtangin</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
