import Link from "next/link";
import { Languages, MapPin } from "lucide-react";

import { BARANGAY } from "@/lib/site";
import {
  NexoraGlyph,
  NexoraMark,
} from "@/app/(auth)/_components/nexora-mark";

/**
 * The public footer, shared by every crawlable page. Its "Services" column is
 * the site's real internal nav: each entry is a distinct indexable route, not a
 * homepage anchor, so search engines have named destinations to follow (and to
 * offer as sitelinks) instead of a single-page site.
 */
const COLUMNS = [
  {
    heading: "Services",
    links: [
      { href: "/services", label: "Services and documents" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/announcements", label: "Announcements" },
      { href: "/verify", label: "Verify a document" },
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

export function SiteFooter() {
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
                {BARANGAY.streetAddress}, {BARANGAY.locality},{" "}
                {BARANGAY.province} {BARANGAY.postalCode}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Languages className="size-4 shrink-0 text-primary" aria-hidden />
              Available in English and Filipino
            </p>
          </div>
        </div>

        {COLUMNS.map((col) => (
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
