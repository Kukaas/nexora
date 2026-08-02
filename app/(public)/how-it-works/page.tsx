import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleDot,
  Clock,
  Route,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BARANGAY } from "@/lib/site";
import { PageHeading, PageShell } from "@/app/_components/page-shell";
import {
  JsonLd,
  breadcrumbLd,
  faqLd,
  graph,
} from "@/app/_components/json-ld";

export const metadata: Metadata = {
  title: "How it works · Barangay Libtangin",
  description:
    "Every step of requesting a barangay document online: creating an account, getting your ID verified, filing a request, paying the fee, tracking its status, and claiming the released document.",
  alternates: { canonical: "/how-it-works" },
};

/**
 * The full journey, not the three-line summary the homepage carries. Each stage
 * says what the resident does, what the barangay does, and how long it takes,
 * so someone deciding whether to bother can see the whole thing before signing
 * up.
 */
const STAGES = [
  {
    n: "01",
    title: "Create your account",
    time: "About 3 minutes",
    body: "Sign up with an email address you can open, choose a password, and confirm the link we send you. One account covers every request you will ever file with the barangay — you never register again.",
    points: [
      "Free for every resident of Barangay Libtangin",
      "Works on any phone browser; nothing to install",
      "Forgot your password later? Reset it yourself from the sign-in page",
    ],
  },
  {
    n: "02",
    title: "Complete your profile",
    time: "About 5 minutes",
    body: "Fill in your full name, birthdate, contact number, and your complete address including purok. This is what the barangay checks against its records to confirm you actually live in Libtangin.",
    points: [
      "Your address determines which purok's notices you receive",
      "Details can be corrected later from your profile",
      "Nothing is shown publicly — only barangay officials can see it",
    ],
  },
  {
    n: "03",
    title: "Upload a valid government ID",
    time: "Reviewed within a day or two",
    body: "Upload a clear photo of a government-issued ID. A barangay official compares it against the details on your profile and approves it. Until your ID is approved you can still browse, but no document can be released to you.",
    points: [
      "Make sure the whole ID is in frame, in focus, and readable",
      "You are notified the moment it is approved or sent back",
      "If it is rejected, the reason is stated so you can resubmit",
    ],
  },
  {
    n: "04",
    title: "File your request",
    time: "A couple of minutes",
    body: "Choose the document you need, answer the few questions that document asks for, and state your purpose. The fee and how soon it will be ready are both shown before you submit — you always see the cost first.",
    points: [
      "Each document asks only for what it actually prints",
      "Review everything on one screen before submitting",
      "You can edit a request while it is still pending",
    ],
  },
  {
    n: "05",
    title: "Pay the fee",
    time: "Same day",
    body: `Pay through one of the methods ${BARANGAY.name} has enabled and upload your proof of payment. The treasurer confirms it and records the official receipt number against your request. Documents issued free of charge skip this step entirely.`,
    points: [
      "The exact amount is shown before you pay",
      "Upload a screenshot or photo of your proof",
      "The OR number is recorded on the request itself",
    ],
  },
  {
    n: "06",
    title: "Track it, then claim it",
    time: "Usually 1–3 days",
    body: "Follow the request from pending, to processing, to ready. When it is released you can download the finished PDF and print it, or claim the printed copy at the barangay hall. Either copy carries the same QR code and reference number.",
    points: [
      "Every status change is visible on the request",
      "Message the barangay from inside the app if something is unclear",
      "Download it as many times as you need",
    ],
  },
];

const STATUSES = [
  {
    label: "Pending",
    body: "Filed and waiting for the barangay secretary to pick it up. You can still edit or withdraw it at this stage.",
  },
  {
    label: "Processing",
    body: "An official is preparing the document. Payment, if the document carries a fee, is confirmed during this stage.",
  },
  {
    label: "Ready",
    body: "The document has been issued. Download the PDF or claim the printed copy at the hall.",
  },
  {
    label: "Claimed",
    body: "You have collected the printed copy. The record and its verification link stay valid.",
  },
  {
    label: "Rejected",
    body: "Something was wrong with the request, and the reason is stated on it. Fix what was flagged and file again.",
  },
];

/**
 * Shown on the page *and* emitted as FAQPage structured data. The two must stay
 * identical — this array is the single source for both.
 */
const FAQ = [
  {
    question: "Do I still need to go to the barangay hall?",
    answer:
      "Only if you want the printed copy. You can create your account, file the request, pay, and download the finished PDF without leaving home. Many offices accept the downloaded copy because it carries a QR code they can verify themselves.",
  },
  {
    question: "How much does it cost to use Nexora?",
    answer:
      "Nexora itself is free for residents of Barangay Libtangin. You pay only the barangay's own fee for the document you request, and that amount is shown before you submit. Certificates of indigency are issued free of charge.",
  },
  {
    question: "How long does a request take?",
    answer:
      "Most documents are ready in one to three days once your ID has been approved. The exact turnaround for each document is shown on the services page and again before you submit your request.",
  },
  {
    question: "Why do I need to upload a government ID?",
    answer:
      "Barangay documents are official records, so the barangay has to know it is really you before issuing one. The ID is checked once by an official; after it is approved, every later request goes through without repeating the step.",
  },
  {
    question: "Is the downloaded PDF a real barangay document?",
    answer:
      "Yes. It is issued by Barangay Libtangin after an official has approved the request, and it carries a QR code and reference number. Anyone can scan the code to confirm the document is genuine and still current.",
  },
  {
    question: "What if I make a mistake on my request?",
    answer:
      "While a request is still pending you can edit it yourself. Once it is being processed, message the barangay from inside the app and an official can correct it or send it back to you.",
  },
  {
    question: "Can I use Nexora if I am not a resident of Libtangin?",
    answer:
      "Nexora serves Barangay Libtangin, Gasan, Marinduque, so documents are issued only to its residents. Anyone, resident or not, can still use the verification page to check a document issued by the barangay.",
  },
];

export default function HowItWorksPage() {
  return (
    <PageShell>
      <JsonLd
        data={graph(
          breadcrumbLd([{ name: "How it works", path: "/how-it-works" }]),
          faqLd(FAQ),
        )}
      />

      <PageHeading
        eyebrow={
          <>
            <Route className="size-4 text-primary" aria-hidden />
            From sign-up to signed document
          </>
        }
        title="How requesting a barangay document works"
        lead={`Six stages, start to finish, with nothing left to guess. This is the whole process ${BARANGAY.name} follows for every document it issues online.`}
      >
        <Button asChild size="lg" className="h-12 px-6 text-base">
          <Link href="/sign-up">
            Create your account
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </PageHeading>

      {/* ------------------------------------------------------------------ */}
      {/* The six stages                                                     */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <ol className="flex flex-col">
            {STAGES.map((stage) => (
              <li
                key={stage.n}
                className="grid grid-cols-1 gap-x-12 gap-y-4 border-t border-border py-10 md:grid-cols-[10rem_1fr] lg:grid-cols-[14rem_1fr]"
              >
                <div className="flex items-baseline gap-3 md:flex-col md:gap-1">
                  <span className="font-mono text-sm font-medium text-primary">
                    {stage.n}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden />
                    {stage.time}
                  </span>
                </div>

                <div className="max-w-2xl">
                  <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                    {stage.title}
                  </h2>
                  <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
                    {stage.body}
                  </p>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {stage.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <CircleDot
                          className="mt-0.5 size-4 shrink-0 text-primary"
                          aria-hidden
                        />
                        <span className="text-pretty">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* What each status means                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border bg-secondary py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
              What each status means
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              A request moves through these five states, and the one it is in is
              always shown on the request itself.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-4xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {STATUSES.map((status) => (
              <div key={status.label} className="bg-background p-7">
                <dt className="font-semibold tracking-tight">{status.label}</dt>
                <dd className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  {status.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ — mirrored by the FAQPage JSON-LD above                        */}
      {/* ------------------------------------------------------------------ */}
      {/* Answers stay open rather than sitting behind an accordion: Radix
          unmounts collapsed content, which would keep every answer out of the
          server HTML — and marked-up FAQ text has to be visible on the page. */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <h2 className="text-balance text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
            Questions residents ask
          </h2>

          <dl className="mt-10 flex flex-col divide-y divide-border border-y border-border">
            {FAQ.map((item) => (
              <div key={item.question} className="py-6">
                <dt className="text-lg font-semibold tracking-tight">
                  {item.question}
                </dt>
                <dd className="mt-2.5 text-pretty leading-relaxed text-muted-foreground">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="rounded-[2rem] bg-accent px-7 py-12 text-center ring-1 ring-primary/15 sm:px-12 sm:py-16">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <BadgeCheck className="size-6" aria-hidden />
            </span>
            <h2 className="mt-6 text-balance text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.025em] text-accent-foreground">
              Ready to file your first request?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-accent-foreground/80">
              Create your account, get your ID approved once, and request every
              document you need from then on without lining up.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
                <Link href="/services">See what you can request</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
