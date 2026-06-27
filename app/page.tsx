import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  ClipboardList,
  Clock,
  FileText,
  Languages,
  MapPin,
  Megaphone,
  ScanLine,
  Scale,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NexoraGlyph,
  NexoraMark,
} from "@/app/(auth)/_components/nexora-mark";
import { SiteHeader } from "./_components/site-header";

export const metadata: Metadata = {
  title: "Barangay Libtangin | Online services on Nexora",
  description:
    "Residents of Barangay Libtangin, Gasan, Marinduque can request clearances, certificates, and permits online on Nexora, track each request, and verify any document with its QR code.",
};

const SAMPLE_REFERENCE = "LIB-2026-04817";

const FACTS = [
  { icon: MapPin, label: "Gasan, Marinduque" },
  { icon: UserRound, label: "Serving 1,676 residents" },
  { icon: Building2, label: "Zip 4905" },
  { icon: Clock, label: "Online anytime" },
];

const SERVICES = [
  {
    icon: ShieldCheck,
    name: "Barangay Clearance",
    body: "For employment, business, or proof of good standing.",
  },
  {
    icon: FileText,
    name: "Certificate of Residency",
    body: "Official proof that you live in Barangay Libtangin.",
  },
  {
    icon: BadgeCheck,
    name: "Certificate of Indigency",
    body: "For scholarships, medical assistance, and legal aid.",
  },
  {
    icon: Building2,
    name: "Business Permit",
    body: "Register or renew a barangay business permit.",
  },
  {
    icon: Scale,
    name: "Complaints and Blotter",
    body: "File a report and follow it through to resolution.",
  },
  {
    icon: ClipboardList,
    name: "Assistance Requests",
    body: "Ask the barangay for help and track the response.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create your account",
    body: "Sign up with your email and a password, then confirm your email to activate the account.",
  },
  {
    n: "02",
    title: "Complete your profile",
    body: "Add your details and a valid government ID so Barangay Libtangin can verify who you are.",
  },
  {
    n: "03",
    title: "Request and track",
    body: "Choose a document, submit your request, and follow it from filing to release. Download it when it is ready.",
  },
];

const RESIDENT_POINTS = [
  "Request documents without travelling to the hall",
  "Track every filing from submission to release",
  "Download finished documents, ready to print",
  "Plain language, in English and Filipino",
];

const OFFICIAL_POINTS = [
  "Approve resident registrations with confidence",
  "Issue clearances and certificates as verified PDFs",
  "Keep one authoritative registry for Libtangin",
  "Oversee requests, treasury, and reports in one place",
];

export default async function Home() {
  // A real, scannable QR for the sample clearance. Rendered on the server, so it
  // ships as inline SVG with no client cost and no broken-image risk.
  const qrSvg = await QRCode.toString(
    `https://nexora.ph/libtangin/verify/${SAMPLE_REFERENCE}`,
    {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#231a12", light: "#00000000" },
    },
  );

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus:ring-3 focus:ring-primary/40"
      >
        Skip to content
      </a>
      <SiteHeader />

      <main id="main" className="flex flex-col">
        {/* ---------------------------------------------------------------- */}
        {/* Hero */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 lg:pt-40 lg:pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 75% 0%, oklch(0.962 0.03 90 / 0.7) 0%, transparent 60%)",
            }}
          />

          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground ring-1 ring-primary/15">
                <NexoraGlyph className="size-4 text-primary" aria-hidden />
                Official online services of Barangay Libtangin
              </span>

              <h1 className="mt-6 text-balance text-[clamp(2.5rem,6vw,4.25rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
                Barangay Libtangin, served from your phone.
              </h1>

              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Residents of Libtangin, Gasan, Marinduque can now request clearances,
                certificates, and permits on Nexora, track each request, and
                download it the moment it is ready. No more lining up at the
                hall.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link href="/sign-up">
                    Create your account
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base"
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>

              <ul className="mt-7 flex flex-col gap-2.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
                {[
                  "Free for Libtangin residents",
                  "Every document carries a QR you can verify",
                  "Available in English and Filipino",
                ].map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-primary" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hero artifact: the barangay's actual output. */}
            <div className="motion-safe:animate-in motion-safe:fade-in-50 motion-safe:slide-in-from-bottom-6 motion-safe:duration-700 motion-safe:[animation-delay:120ms] motion-safe:fill-mode-backwards">
              <ClearanceArtifact qrSvg={qrSvg} />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Locator strip: real facts, restrained */}
        {/* ---------------------------------------------------------------- */}
        <section className="border-y border-border bg-secondary">
          <ul className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5 text-sm sm:justify-between sm:px-8">
            {FACTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5">
                <Icon className="size-4 text-primary" aria-hidden />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Services */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="services"
          className="scroll-mt-20 py-20 sm:py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
                What you can request from the barangay
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                The documents and requests residents of Libtangin need most,
                each issued as a verified PDF you can download.
              </p>
            </div>

            {/* A counter board, not a card grid: a ruled ledger of services. */}
            <ul className="mt-12 grid grid-cols-1 gap-x-12 border-t border-border md:grid-cols-2">
              {SERVICES.map(({ icon: Icon, name, body }) => (
                <li
                  key={name}
                  className="group flex items-start gap-4 border-b border-border py-6 transition-colors"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight">
                      {name}
                    </h3>
                    <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* How it works */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="how-it-works"
          className="scroll-mt-20 bg-secondary py-20 sm:py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
                Three steps, start to finish
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                From creating an account to holding a verified document, with
                nothing left to guess.
              </p>
            </div>

            <ol className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-4xl border border-border bg-border md:grid-cols-3">
              {STEPS.map((step) => (
                <li
                  key={step.n}
                  className="flex flex-col bg-background p-7 sm:p-8"
                >
                  <span className="font-mono text-sm font-medium text-primary">
                    {step.n}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-pretty leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Residents and officials (signature dark band) */}
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-[oklch(0.2_0.012_72)] py-20 text-[oklch(0.97_0.008_80)] sm:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(110% 70% at 12% 0%, oklch(0.27 0.03 75 / 0.5) 0%, transparent 55%)",
            }}
          />
          <NexoraGlyph
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -right-24 size-[34rem] text-primary opacity-[0.05]"
          />

          <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
                Built for the whole barangay
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-[oklch(0.82_0.012_80)]">
                Whether you live in Libtangin or work in the barangay office,
                you use the same system, designed for both sides of the counter.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
              <AudienceColumn
                icon={UserRound}
                eyebrow="For residents"
                title="Transact without the trip"
                points={RESIDENT_POINTS}
              />
              <AudienceColumn
                icon={Building2}
                eyebrow="For barangay officials"
                title="One source of truth"
                points={OFFICIAL_POINTS}
              />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Announcements (honest empty state) */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="announcements"
          className="scroll-mt-20 py-20 sm:py-24"
        >
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
                From the Barangay Hall
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                Advisories, schedules, and assembly notices, posted by the
                Barangay Libtangin office.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-5 rounded-4xl border border-dashed border-border bg-secondary/60 px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary ring-1 ring-primary/15">
                <Megaphone className="size-6" aria-hidden />
              </span>
              <div className="max-w-md">
                <p className="text-lg font-semibold tracking-tight">
                  No announcements yet
                </p>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  When Barangay Libtangin posts an update, it will appear here.
                  Create an account to get advisories the moment they are
                  published.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create your account
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Verify */}
        {/* ---------------------------------------------------------------- */}
        <section
          id="verify"
          className="scroll-mt-20 border-y border-border bg-secondary py-20 sm:py-24"
        >
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-2">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground ring-1 ring-primary/15">
                <ScanLine className="size-4 text-primary" aria-hidden />
                Built-in verification
              </span>
              <h2 className="mt-6 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
                Every Libtangin document, verifiable
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                Each clearance and certificate carries a QR code. Anyone holding
                the document, an employer, a bank, another office, can scan it
                and confirm in seconds that Barangay Libtangin issued it and
                that it is still current.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-muted-foreground">Issued by</dt>
                  <dd className="mt-1 font-medium">Barangay Libtangin</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Confirmed in</dt>
                  <dd className="mt-1 font-medium">A single scan</dd>
                </div>
              </dl>
            </div>

            {/* The result of a scan: a verification panel. */}
            <VerificationPanel qrSvg={qrSvg} />
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Final CTA */}
        {/* ---------------------------------------------------------------- */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-accent px-7 py-14 text-center ring-1 ring-primary/15 sm:px-12 sm:py-20">
              <NexoraGlyph
                aria-hidden
                className="pointer-events-none absolute -top-16 -left-12 size-64 text-primary opacity-[0.07]"
              />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-balance text-[clamp(1.875rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.025em] text-accent-foreground">
                  Skip the line at the hall
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-pretty text-lg leading-relaxed text-accent-foreground/80">
                  Create your account today and request your first document from
                  Barangay Libtangin, wherever you are.
                </p>
                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-12 px-6 text-base">
                    <Link href="/sign-up">
                      Create your account
                      <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 bg-background px-6 text-base"
                  >
                    <Link href="/sign-in">I already have an account</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Presentational pieces (server components)                                */
/* ------------------------------------------------------------------------ */

function ClearanceArtifact({ qrSvg }: { qrSvg: string }) {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mr-0">
      {/* The clearance itself. */}
      <article className="nx-float relative rounded-4xl border border-border bg-card p-6 shadow-xl shadow-foreground/[0.06] ring-1 ring-foreground/5 sm:p-7">
        <NexoraGlyph
          aria-hidden
          className="pointer-events-none absolute right-5 top-5 size-24 text-primary opacity-[0.06]"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <NexoraGlyph className="size-7 text-primary" aria-hidden />
            <div className="leading-tight">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                Barangay Libtangin
              </p>
              <p className="text-sm font-semibold tracking-tight">
                Barangay Clearance
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            <BadgeCheck className="size-3.5" aria-hidden />
            Verified
          </span>
        </div>

        <div className="my-6 h-px bg-border" />

        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Issued to</p>
            <p className="mt-1 truncate text-lg font-semibold tracking-tight">
              Juan C. Dela Cruz
            </p>
            <p className="mt-3 text-xs text-muted-foreground">Purpose</p>
            <p className="mt-0.5 text-sm font-medium">Local employment</p>
          </div>

          {/* Real, scannable QR. */}
          <div className="shrink-0 rounded-2xl border border-border bg-background p-2.5">
            <div
              className="size-20"
              aria-hidden
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-[0.7rem] text-muted-foreground">Reference no.</p>
            <p className="font-mono text-sm font-medium">{SAMPLE_REFERENCE}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.7rem] text-muted-foreground">Issued</p>
            <p className="font-mono text-sm font-medium">24 Jun 2026</p>
          </div>
        </div>
      </article>

      {/* Floating status chip, overlapping the corner, to add depth and show
          the tracking story the product is built around. */}
      <div className="absolute -bottom-9 -left-4 w-52 rounded-3xl border border-border bg-card p-4 shadow-lg shadow-foreground/[0.08] ring-1 ring-foreground/5 sm:-left-10">
        <p className="text-xs font-medium text-muted-foreground">
          Request status
        </p>
        <ol className="mt-3 space-y-2.5">
          {[
            { label: "Submitted", current: false },
            { label: "Verified", current: false },
            { label: "Issued", current: true },
          ].map((s) => (
            <li key={s.label} className="flex items-center gap-2.5 text-sm">
              <span
                className={
                  s.current
                    ? "flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : "flex size-5 items-center justify-center rounded-full bg-secondary text-muted-foreground"
                }
              >
                <Check className="size-3" aria-hidden />
              </span>
              <span
                className={
                  s.current ? "font-semibold" : "text-muted-foreground"
                }
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function VerificationPanel({ qrSvg }: { qrSvg: string }) {
  return (
    <div className="rounded-4xl border border-border bg-card p-7 shadow-lg shadow-foreground/[0.05] ring-1 ring-foreground/5 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-[oklch(0.62_0.13_150)]/12 text-[oklch(0.5_0.12_150)]">
            <BadgeCheck className="size-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">Document verified</p>
            <p className="text-sm text-muted-foreground">
              Genuine and current
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background p-2">
          <div
            className="size-14"
            aria-hidden
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        </div>
      </div>

      <dl className="mt-6 divide-y divide-border text-sm">
        {[
          { k: "Document", v: "Barangay Clearance" },
          { k: "Issued by", v: "Barangay Libtangin" },
          { k: "Reference no.", v: SAMPLE_REFERENCE, mono: true },
          { k: "Issued on", v: "24 Jun 2026", mono: true },
        ].map((row) => (
          <div
            key={row.k}
            className="flex items-center justify-between gap-4 py-3"
          >
            <dt className="text-muted-foreground">{row.k}</dt>
            <dd
              className={
                row.mono
                  ? "font-mono font-medium"
                  : "font-medium tracking-tight"
              }
            >
              {row.v}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AudienceColumn({
  icon: Icon,
  eyebrow,
  title,
  points,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  eyebrow: string;
  title: string;
  points: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-primary">{eyebrow}</p>
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      <ul className="mt-6 flex flex-col gap-3.5">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <Check
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            <span className="text-pretty text-[oklch(0.86_0.01_80)]">
              {point}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SiteFooter() {
  const columns = [
    {
      heading: "Services",
      links: [
        { href: "#services", label: "What you can request" },
        { href: "#how-it-works", label: "How it works" },
        { href: "#announcements", label: "Announcements" },
        { href: "#verify", label: "Verify a document" },
      ],
    },
    {
      heading: "Account",
      links: [
        { href: "/sign-up", label: "Create account" },
        { href: "/sign-in", label: "Sign in" },
        { href: "/forgot-password", label: "Reset password" },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-3">
            <NexoraMark />
            <span aria-hidden className="h-5 w-px bg-border" />
            <span className="text-sm leading-tight text-muted-foreground">
              for Barangay
              <span className="block font-medium text-foreground">
                Libtangin
              </span>
            </span>
          </div>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground">
            The online services portal of Barangay Libtangin, powered by Nexora.
            Register, request documents, and track each one, from your phone.
          </p>
          <div className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Barangay Hall, Libtangin, Gasan, Marinduque 4905
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Languages className="size-4 shrink-0 text-primary" aria-hidden />
              Available in English and Filipino
            </p>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h2 className="text-sm font-semibold tracking-tight">
              {col.heading}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-border bg-secondary">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-2 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-8">
          <p>© 2026 Barangay Libtangin, Gasan, Marinduque.</p>
          <p className="inline-flex items-center gap-2">
            <NexoraGlyph className="size-4 text-primary" aria-hidden />
            Powered by Nexora
          </p>
        </div>
      </div>
    </footer>
  );
}
