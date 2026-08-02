import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowRight,
  BadgeCheck,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BARANGAY, SITE_URL } from "@/lib/site";
import { PageHeading, PageShell } from "@/app/_components/page-shell";
import { JsonLd, breadcrumbLd, faqLd, graph } from "@/app/_components/json-ld";
import { VerifyCodeForm } from "./_components/verify-code-form";

export const metadata: Metadata = {
  title: "Verify a document · Barangay Libtangin",
  description:
    "Check whether a barangay clearance, certificate, or permit was really issued by Barangay Libtangin. Scan the QR code on the document or type its verification code.",
  alternates: { canonical: "/verify" },
};

const SAMPLE_CODE = "7HQ2K9MJ4TXP0V3B";

const CHECKS = [
  {
    icon: ShieldCheck,
    title: "That the barangay issued it",
    body: `The document appears in ${BARANGAY.name}'s own records as one it released. A document that was never issued has no record to find.`,
  },
  {
    icon: BadgeCheck,
    title: "Who it was issued to",
    body: "The holder's name and the document's reference number, so you can check them against the printed copy in your hand.",
  },
  {
    icon: ScanLine,
    title: "When it was issued",
    body: "The release date and the document's current status, so you can tell a current document from a stale one.",
  },
];

/**
 * Shown on the page and emitted as FAQPage structured data — the two must match.
 */
const FAQ = [
  {
    question: "Do I need an account to verify a document?",
    answer:
      "No. Verification is open to anyone. Employers, banks, schools, and other offices can scan the QR code or type the verification code without signing up for anything.",
  },
  {
    question: "Where is the verification code on the document?",
    answer:
      "It is printed beside the QR code on the released document — sixteen letters and numbers. Scanning the QR opens the same page automatically, so typing the code is only a fallback.",
  },
  {
    question: "What does it mean if a document cannot be verified?",
    answer:
      "It means no issued document matches that code. Usually the code was mistyped or the QR was damaged, but it can also mean the document has not been released yet, or that it is not genuine. Contact Barangay Libtangin to confirm.",
  },
  {
    question: "Can someone look up a resident's documents with this?",
    answer:
      "No. Each code is unguessable and resolves to exactly one document, so the page can only be reached by someone actually holding that document. There is no way to browse or search residents' records.",
  },
];

export default async function VerifyLandingPage() {
  // A real, scannable QR for the sample code, rendered server-side so it ships
  // as inline SVG. Scanning it lands on the "couldn't verify" state, which is
  // exactly what the example is meant to show.
  const qrSvg = await QRCode.toString(`${SITE_URL}/verify/${SAMPLE_CODE}`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#231a12", light: "#00000000" },
  });

  return (
    <PageShell>
      <JsonLd
        data={graph(
          breadcrumbLd([{ name: "Verify a document", path: "/verify" }]),
          faqLd(FAQ),
        )}
      />

      <PageHeading
        eyebrow={
          <>
            <ScanLine className="size-4 text-primary" aria-hidden />
            Built-in verification
          </>
        }
        title="Check that a barangay document is genuine"
        lead={`Every clearance, certificate, and permit ${BARANGAY.name} issues carries a QR code and a verification code. Scan or type it and confirm in seconds that the barangay really issued the document in front of you.`}
      />

      {/* ------------------------------------------------------------------ */}
      {/* The lookup itself                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-border bg-secondary py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-10 px-5 sm:px-8 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div className="rounded-4xl border border-border bg-card p-7 shadow-sm sm:p-9">
            <h2 className="text-balance text-2xl font-semibold tracking-tight">
              Enter a verification code
            </h2>
            <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
              No account needed. Anyone holding a printed document can check it
              here.
            </p>
            <div className="mt-8">
              <VerifyCodeForm />
            </div>
          </div>

          <div>
            <div className="flex items-start gap-5 rounded-4xl border border-border bg-card p-7">
              <div className="shrink-0 rounded-2xl border border-border bg-background p-3">
                <div
                  className="size-24"
                  aria-hidden
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold tracking-tight">
                  Or just scan the QR
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  Point any phone camera at the code on the document. It opens
                  the same result page, with nothing to type.
                </p>
                <p className="mt-3 font-mono text-xs text-muted-foreground">
                  {SAMPLE_CODE}
                </p>
              </div>
            </div>

            <p className="mt-5 text-pretty text-sm leading-relaxed text-muted-foreground">
              The code above is only an example, so it will report that no
              document matches — which is exactly what a forged or mistyped code
              looks like.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* What verification confirms                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
              What a check confirms
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              A successful verification shows the few facts you need to trust the
              paper in your hand, and nothing more about the resident.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-4xl border border-border bg-border md:grid-cols-3">
            {CHECKS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col bg-background p-7">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-4 rounded-4xl border border-amber-500/40 bg-amber-500/5 p-6">
            <ShieldAlert
              className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden
            />
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Always compare the result against the printed copy.
              </span>{" "}
              If the name, reference number, or date on this site differs from
              what is printed on the document, treat the document as
              unverified and contact {BARANGAY.name}.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ — mirrored by the FAQPage JSON-LD above                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <h2 className="text-balance text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
            About verification
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

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
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
              <Link href="/services">See what you can request</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
