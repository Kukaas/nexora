# Product

## Register

product

> Nexora is mixed-surface: a public **landing page** (brand register, design IS the product)
> plus the **authenticated app** (product register, design SERVES the workflow). The app is
> the bulk of the system, so `product` is the default. When working specifically on the
> marketing/landing surface, override to `brand` for that task and read `reference/brand.md`.

## Users

Nexora serves a single barangay (the smallest unit of Philippine local government) and has
two distinct audiences, designed role-based from one system:

- **Barangay officials & staff** — Captain, Kagawad (council members), Secretary, Treasurer,
  and admins. They work back-office: approving resident registrations, issuing documents,
  maintaining the resident registry, handling requests/cases, and overseeing governance and
  finances. They want density, speed, and confidence that records are correct.
- **Residents** — community members who self-register (email + password), verify their email,
  complete a profile/setup step with government IDs (driver's license, passport, SSS, GSIS,
  PRC), then request documents and track their status. Many are on budget Android phones over
  slower connections, span a wide range of digital literacy, and may prefer Filipino/Tagalog.
  The resident experience must be guided, forgiving, and reassuring.

Context of use: a real government interaction where the stakes feel official (an ID, a
clearance, a permit). Trust and clarity matter more than flair.

## Product Purpose

Nexora digitizes barangay services so residents can transact online instead of lining up at
the hall, and officials can run the barangay from one source of truth. It exists to make four
jobs easier:

1. **Issue documents** — barangay clearances, certificates of residency/indigency, business
   permits, and similar, generated as PDFs with QR-code verification.
2. **Manage resident records** — a verified resident registry with IDs, roles, and households;
   the authoritative record for the barangay.
3. **Governance & transparency** — officials directory, announcements, treasury/financials,
   reports, and audit trails.
4. **Requests & cases** — complaints, blotter entries, and assistance requests, tracked from
   submission to resolution.

Success looks like: a resident completes a document request from their phone without visiting
the hall, and an official issues it with confidence the record behind it is verified.

## Brand Personality

**Trustworthy, official, reassuring.** Nexora should feel like a legitimate public institution
that has been modernized: calm, credible, and secure, never cold. The voice is plain and
direct (it has to work for low digital literacy and for a bilingual EN/Filipino audience), and
warm enough that an ordinary resident isn't intimidated. Restrained color, clear structure,
and honest copy carry the credibility; the institution earns trust by being legible and
correct, not by decoration.

Three words: **credible, clear, civic.**

## Anti-references

- **Dated government portal** — the cluttered 2000s-era gov website with dense link lists,
  clashing colors, tiny text, and broken layouts. This is the thing Nexora replaces.
- **Generic SaaS dashboard** — indistinct purple-gradient startup template, hero-metric card
  walls, looks like every other admin tool. (See the hero-metric and identical-card-grid bans.)
- **Childish / toy-like** — over-rounded shapes, bright cartoon palette, playful illustrations
  that undercut official credibility.
- **Cold & intimidating** — sterile enterprise-bank sterility that makes ordinary residents
  anxious. Official, but human.

## Design Principles

1. **Legible over clever.** Every screen is readable at a glance by someone using it for the
   first time, on a small phone, possibly in a second language. Clarity is the feature.
2. **Earn trust by being correct.** Verification state, record provenance, and document
   authenticity (QR, status) are always visible. The interface should make "this is official"
   self-evident, not asserted.
3. **Two audiences, one system.** Officials get density and control; residents get a guided,
   forgiving path. Neither experience is the other's afterthought.
4. **Forgiving by default.** Big tap targets, plain-language errors that say what to do next,
   confirmations before anything irreversible. Assume the user is unsure and help them anyway.
5. **Dignified, not decorated.** Civic pride and credibility come from structure, typography,
   and restraint, not gradients, glass, or ornament.

## Accessibility & Inclusion

- **WCAG 2.1 AA** as the baseline: contrast (≥4.5:1 body, ≥3:1 large), visible focus states,
  full keyboard navigation, semantic markup.
- **Mobile-first, low-end** — design for small screens and light pages first; assume budget
  Android devices and slower connections. Keep payloads and motion cheap.
- **Low digital literacy** — plain language, generous tap targets (≥44px), forgiving and
  clearly-labeled forms, explicit guidance for users new to online services.
- **Bilingual (EN/Filipino)** — copy and layout must accommodate Filipino/Tagalog (and
  possibly regional languages); allow for longer strings and don't hard-code English-only
  assumptions into layouts.
- **Reduced motion** — honor `prefers-reduced-motion`; every animation needs a calm
  alternative.
