import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Clock,
  FileText,
  IdCard,
  ScanLine,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getActiveDocumentTypes } from "@/lib/documents-data";
import { turnaroundLabel } from "@/lib/documents";
import { BARANGAY } from "@/lib/site";
import { PageHeading, PageShell } from "@/app/_components/page-shell";
import {
  SERVICE_CATALOG,
  iconForDocumentType,
} from "@/app/_components/service-catalog";
import {
  JsonLd,
  breadcrumbLd,
  graph,
} from "@/app/_components/json-ld";

export const metadata: Metadata = {
  title: "Services and documents · Barangay Libtangin",
  description:
    "Barangay clearances, certificates of residency and indigency, business permits, and assistance requests from Barangay Libtangin, Gasan, Marinduque — with each document's fee and how long it takes.",
  alternates: { canonical: "/services" },
};

// Fees and turnaround are read from the live document-type table. Rendered per
// request rather than prerendered, so `next build` never needs the database and
// a fee the secretary changes is public immediately. Crawlers still get the
// fully rendered HTML either way.
export const dynamic = "force-dynamic";

const PREPARE = [
  {
    icon: UserRound,
    title: "A Nexora account",
    body: "Sign up with an email address you can open, then confirm it. One account covers every request you will ever file with the barangay.",
  },
  {
    icon: IdCard,
    title: "A valid government ID",
    body: "Upload a clear photo of a government-issued ID. A barangay official checks it against your details before your first document is released.",
  },
  {
    icon: FileText,
    title: "Your complete address",
    body: `Your house number, street, and purok within ${BARANGAY.name}. This is what the barangay checks to confirm you are a resident.`,
  },
  {
    icon: ScanLine,
    title: "The purpose of the request",
    body: "Most documents print the purpose on the face of the certificate, so state exactly what you need it for — employment, a scholarship, a bank, an agency.",
  },
];

export default async function ServicesPage() {
  const types = await getActiveDocumentTypes();

  return (
    <PageShell>
      <JsonLd
        data={graph(
          breadcrumbLd([{ name: "Services", path: "/services" }]),
        )}
      />

      <PageHeading
        eyebrow={
          <>
            <FileText className="size-4 text-primary" aria-hidden />
            Barangay Libtangin services
          </>
        }
        title="Documents and services you can request online"
        lead={`Everything ${BARANGAY.name} issues to its residents, requestable from your phone and released as a verified PDF with a QR code anyone can check.`}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
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
            <Link href="/how-it-works">See how it works</Link>
          </Button>
        </div>
      </PageHeading>

      {/* ------------------------------------------------------------------ */}
      {/* The catalogue itself                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
              What you can request
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              {types.length > 0
                ? "The documents Barangay Libtangin is issuing right now, with the fee and how soon each is ready."
                : "The documents residents of Libtangin need most, each issued as a verified PDF you can download."}
            </p>
          </div>

          {types.length > 0 ? (
            <ul className="mt-12 grid grid-cols-1 gap-x-12 border-t border-border md:grid-cols-2">
              {types.map((type) => {
                const Icon = iconForDocumentType(type.name);
                return (
                  <li
                    key={type.id}
                    className="group flex items-start gap-4 border-b border-border py-6"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold tracking-tight">
                        {type.name}
                      </h3>
                      {type.description ? (
                        <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                          {type.description}
                        </p>
                      ) : null}
                      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Banknote className="size-4 text-primary" aria-hidden />
                          {type.fee > 0
                            ? type.fee.toLocaleString("en-PH", {
                                style: "currency",
                                currency: "PHP",
                              })
                            : "Free"}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="size-4" aria-hidden />
                          {turnaroundLabel(type.turnaroundDays)}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="mt-12 grid grid-cols-1 gap-x-12 border-t border-border md:grid-cols-2">
              {SERVICE_CATALOG.map(({ icon: Icon, name, body, needs }) => (
                <li
                  key={name}
                  className="group flex items-start gap-4 border-b border-border py-6"
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
                    {needs ? (
                      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Have ready:{" "}
                        </span>
                        {needs}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 text-pretty text-sm leading-relaxed text-muted-foreground">
            Fees are set by {BARANGAY.name} and shown again before you submit, so
            nothing is charged that you have not already seen. Certificates of
            indigency are issued free of charge.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Before you request                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-border bg-secondary py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-balance text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
              What to prepare before you request
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Four things cover almost every request. Have them on hand and a
              filing takes a couple of minutes.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-4xl border border-border bg-border sm:grid-cols-2">
            {PREPARE.map(({ icon: Icon, title, body }) => (
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
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Verification cross-link                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="max-w-xl">
            <h2 className="text-balance text-[clamp(1.5rem,2.5vw,2rem)] font-semibold leading-tight tracking-[-0.02em]">
              Every document is verifiable
            </h2>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
              Whatever you request, the released copy carries a QR code and a
              reference number. An employer, bank, or another office can scan it
              and confirm in seconds that {BARANGAY.name} issued it.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="outline">
                <Link href="/verify">
                  <ScanLine aria-hidden />
                  Verify a document
                </Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create your account
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-4xl border border-border bg-card p-7 shadow-sm">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[oklch(0.62_0.13_150)]/12 text-[oklch(0.5_0.12_150)]">
              <BadgeCheck className="size-5" aria-hidden />
            </span>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">
              Issued by {BARANGAY.name}
            </h3>
            <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
              Documents are released only after a barangay official has checked
              your identity and approved the request. Nothing is auto-issued.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
