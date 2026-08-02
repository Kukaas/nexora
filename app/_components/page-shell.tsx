import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

/**
 * The frame every public page below the homepage shares: skip link, the header
 * in its opaque state, a `<main>` cleared of the fixed header, and the footer.
 * The homepage doesn't use this — its hero runs under a transparent header.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader solid />
      <main id="main" className="flex flex-col pt-16">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * The masthead of a public page: eyebrow, `<h1>`, and a lead paragraph. Keeping
 * one component for it means every page opens with the same rhythm and each has
 * exactly one h1 — which is also the heading Google reads for the page.
 */
export function PageHeading({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: React.ReactNode;
  title: string;
  lead: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 60% at 80% 0%, oklch(0.962 0.03 90 / 0.7) 0%, transparent 60%)",
        }}
      />
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-foreground ring-1 ring-primary/15">
          {eyebrow}
        </span>
        <h1 className="mt-6 max-w-3xl text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em]">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          {lead}
        </p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
