---
name: Nexora
description: Barangay services online, designed to feel like the trusted public counter, made legible and reachable from a phone.
colors:
  primary: "oklch(0.769 0.165 70.08)"
  primary-foreground: "oklch(0.21 0.03 71)"
  accent: "oklch(0.962 0.03 90)"
  accent-foreground: "oklch(0.42 0.09 65)"
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  card: "oklch(1 0 0)"
  secondary: "oklch(0.97 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.49 0 0)"
  border: "oklch(0.922 0 0)"
  input: "oklch(0.922 0 0)"
  ring: "oklch(0.769 0.165 70.08)"
  destructive: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  title:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  base: "0.625rem"
  input: "1.375rem"
  pill: "1.625rem"
  card: "1.625rem"
spacing:
  xs: "0.5rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
    height: "2.25rem"
    padding: "0 0.75rem"
  button-primary-hover:
    backgroundColor: "oklch(0.72 0.16 70.08)"
    textColor: "{colors.primary-foreground}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.pill}"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.pill}"
    height: "2.25rem"
  input:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.input}"
    height: "2.25rem"
    padding: "0.25rem 0.75rem"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
---

# Design System: Nexora

## 1. Overview

**Creative North Star: "The Barangay Hall, Modernized"**

Nexora is the trusted public counter, moved onto a phone. The feeling to chase is the one a resident has when a clerk who knows their name slides a finished clearance across the desk: calm, credible, handled. The system serves two people from one vocabulary, the resident who registers and requests, and the official who verifies and issues, so it has to read as legitimate to both without intimidating either.

The surface is a clean white sheet, the way an official form is clean paper. Warmth and personality come from a single **amber** that does the work of a stamp: it marks what is actionable and what is current, and it appears sparingly so it always means something. Type is **IBM Plex Sans**, an institutional but humanly-drawn family with civic and engineering heritage, paired with **IBM Plex Mono** for the machine identifiers this product runs on (clearance numbers, reference IDs, QR payloads). Shapes are softly rounded, pill buttons and generously-cornered cards, which keep the system approachable for residents with a wide range of digital comfort; the dark ink and the restraint are what keep that softness from tipping into toy.

This system explicitly rejects four things named in PRODUCT.md: the **dated government portal** (dense link walls, clashing color, tiny type), the **generic SaaS dashboard** (purple gradients, hero-metric card walls, indistinct admin template), the **childish / toy-like** (cartoon brightness, over-rounding without weight), and the **cold, intimidating enterprise** (sterile bank chrome that makes an ordinary resident anxious). Official, but human.

**Key Characteristics:**
- Pure-white surfaces; amber carries the brand, never the background.
- One type family for the whole UI; mono only for identifiers.
- Soft rounding (26px cards, pill buttons) balanced by dark ink and restraint.
- Flat by default; depth is a soft ambient shadow on cards, nothing more.
- Built bilingual (EN / Filipino) and mobile-first; layouts tolerate longer strings and small screens.

## 2. Colors

A near-monochrome neutral base lit by a single warm amber; the palette stays quiet so the amber can mean "act here" and "this is current."

### Primary
- **Service Amber** (`oklch(0.769 0.165 70.08)`): The one brand color. Primary buttons, the current selection, focus rings, and the most important status indicators. It is the digital equivalent of the stamp on a document, used on a small fraction of any screen so its presence reads as significance, not decoration.
- **Amber Ink** (`oklch(0.21 0.03 71)`): The deep, warm near-black that sits *on* amber (button labels, text on amber fills). Amber is too light to carry white text; this is its partner.

### Secondary / Accent
- **Pale Amber** (`oklch(0.962 0.03 90)`): A barely-there warm tint for hover backgrounds, selected rows, and quiet highlight surfaces. Warmth without weight.
- **Burnt Amber** (`oklch(0.42 0.09 65)`): Text and icons on Pale Amber surfaces; also the color of an inline link in body copy.

### Neutral
- **Ink** (`oklch(0.145 0 0)`): Primary body and heading text on white. High contrast for first-time, low-literacy, small-screen reading.
- **Muted Ink** (`oklch(0.49 0 0)`): Secondary text, captions, helper copy. Deliberately darkened from the shadcn default (0.556) to clear 4.5:1 on white; do not lighten it back.
- **Paper** (`oklch(1 0 0)`): Page and card background. Literal white, no hidden warmth.
- **Quiet Surface** (`oklch(0.97 0 0)`): Secondary/muted fills, toolbars, table zebra, disabled tracks.
- **Hairline** (`oklch(0.922 0 0)`): Borders, dividers, input field tint.

### Semantic
- **Alert Red** (`oklch(0.577 0.245 27.325)`): Destructive actions and error states only. Never used as an accent.

### Named Rules
**The Amber-for-Action Rule.** Amber marks what the user can do or what is currently true: primary action, current selection, focus, key status. If amber appears on something that is not actionable or stateful, it is wrong. Target ≤10% amber coverage on any screen.

**The Dark-Ink-on-Amber Rule.** Text and icons on any amber fill are always **Amber Ink** (`oklch(0.21 0.03 71)`) or black, never white. White on amber fails contrast and reads cheap.

## 3. Typography

**Display / Body Font:** IBM Plex Sans (with `ui-sans-serif, system-ui, sans-serif` fallback)
**Mono Font:** IBM Plex Mono (with `ui-monospace, monospace` fallback)

**Character:** Plex Sans is institutional without being cold, a typeface with a slight mechanical honesty that suits records and forms, drawn humanely enough to stay friendly. One family carries the entire UI through weight contrast (400 / 500 / 600 / 700). Plex Mono is reserved for the strings a human reads back to a machine.

### Hierarchy
- **Display** (600, 1.875rem / 30px, lh 1.15): Page titles, the one-per-screen heading. Fixed rem, not fluid; product UI is viewed at consistent DPI.
- **Headline** (600, 1.5rem / 24px, lh 1.2): Section headings, modal and sheet titles.
- **Title** (600, 1.125rem / 18px, lh 1.3): Card titles, form-group headings, list-section labels.
- **Body** (400, 0.875rem / 14px, lh 1.5): Default reading size for app density. Prose blocks cap at 65–75ch. Inputs render body at 16px on mobile (drops to 14px ≥ md) to prevent iOS zoom.
- **Label** (500, 0.75rem / 12px, +0.01em): Field labels, table headers, badges, metadata. Sentence case; uppercase only for ≤4-word badges.
- **Mono** (400, 0.875rem / 14px): Clearance numbers, reference IDs, QR payloads, audit timestamps, anything machine-issued and copyable.

### Named Rules
**The One Voice Rule.** IBM Plex Sans carries headings, buttons, labels, body, and data. No second display face. Hierarchy comes from size and weight, not from new families.

**The Identifier Rule.** If a string is a machine-issued identifier a resident or official will read back, copy, or verify (a clearance number, a transaction reference, a QR value), set it in Plex Mono. Human language stays in Plex Sans.

## 4. Elevation

The system is flat by default and conveys structure through tonal layering (white content on a quiet neutral, hairline borders) rather than stacked shadows. The one lifted element is the **card**, which earns a single soft ambient shadow plus a hairline ring so panels of records read as discrete objects without floating. Modals and popovers use the same restrained shadow vocabulary, never a heavy drop shadow.

### Shadow Vocabulary
- **Card rest** (`box-shadow: var(--shadow-md)` paired with `ring-1 ring-foreground/5`): The default object lift for cards and grouped record panels. Soft, diffuse, low-contrast.
- **Overlay** (popover / dropdown / dialog shadow): A slightly deeper version of the same family for transient surfaces; structural, not decorative.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A card gets one soft ambient shadow plus a hairline ring and nothing else lifts. If a 2014-app drop shadow appears (dark, tight, offset), it is too heavy: soften and diffuse it.

## 5. Components

The component layer is already built on a soft, rounded shadcn vocabulary. Keep it consistent; the same control looks the same on every screen.

### Buttons
- **Shape:** Pill (`rounded-4xl`, 1.625rem). Default height 2.25rem (36px); `lg` 40px, `sm` 32px, plus icon sizes.
- **Primary:** Service Amber fill, Amber Ink label (`bg-primary text-primary-foreground`). The single most important action per view.
- **Hover / Focus:** Hover darkens the amber (`hover:bg-primary/80`). Focus shows a 3px amber focus ring (`ring-ring/30`) with a solid ring border; never remove the focus ring. Active nudges down 1px.
- **Secondary / Outline / Ghost:** Secondary is Quiet Surface; Outline is white with a Hairline border; Ghost is transparent with a Quiet Surface hover. Destructive uses a tinted red wash (`bg-destructive/10 text-destructive`), not a solid red slab.
- **Touch:** On resident-facing flows, primary actions use `lg` (≥40px) for generous tap targets.

### Inputs / Fields
- **Style:** Borderless tinted fill at rest (`bg-input/50`), `rounded-3xl` (1.375rem), 16px text on mobile.
- **Focus:** Border resolves to the amber ring and a 3px amber glow (`focus-visible:border-ring focus-visible:ring-ring/30`). The field visibly "wakes up" on focus.
- **Error:** `aria-invalid` switches border and ring to Alert Red. Pair every error field with plain-language helper text that says what to fix.
- **Disabled:** 50% opacity, no pointer events.

### Cards / Containers
- **Corner Style:** `rounded-4xl` (1.625rem).
- **Background:** Paper (white) on the page; Quiet Surface for nested quiet zones (never a nested card).
- **Shadow Strategy:** Card rest shadow + `ring-1 ring-foreground/5` (see Elevation).
- **Internal Padding:** `--card-spacing` of 1.5rem default, 1rem for `data-size=sm`.

### Navigation
- **Style:** Plex Sans labels; current item marked with Service Amber (text or a quiet amber pill), not a heavy block. Inactive items use Muted Ink.
- **Mobile:** Structural collapse (sidebar to sheet / bottom nav), not shrinking type. Officials get density; residents get fewer, larger targets.

### Status & Verification (signature)
- Verification and document state (Pending, Verified, Issued, Rejected) are the product's heartbeat. Express them as **badges**: Pale Amber + Burnt Amber for in-progress/current, a green wash for Verified/Issued, Alert Red wash for Rejected, Quiet Surface for neutral. Always pair color with a text label and icon, never color alone (color-blind safety, low-literacy clarity).

## 6. Do's and Don'ts

### Do:
- **Do** keep backgrounds pure white (`oklch(1 0 0)`); let Service Amber and type carry the brand.
- **Do** reserve Service Amber for action and state, ≤10% of any screen (The Amber-for-Action Rule).
- **Do** put Amber Ink or black on amber fills, never white (The Dark-Ink-on-Amber Rule).
- **Do** set machine identifiers in IBM Plex Mono (The Identifier Rule).
- **Do** ship every interactive component with default, hover, focus, active, disabled, loading, and error states.
- **Do** pair every status color with a label and icon; never rely on color alone.
- **Do** design mobile-first with ≥44px tap targets on resident flows, and leave room for longer Filipino strings.
- **Do** give loading states skeletons that mirror the content, not a centered spinner.

### Don't:
- **Don't** rebuild the **dated government portal**: dense link walls, clashing color, sub-14px body, broken layouts.
- **Don't** drift into the **generic SaaS dashboard**: purple gradients, the hero-metric template (big number + small label + gradient accent), or walls of identical icon-heading-text cards.
- **Don't** go **childish / toy-like**: no cartoon-bright fills, no rounding so soft it reads as a toy. Soft shape is balanced by dark ink and restraint.
- **Don't** go **cold and intimidating**: no sterile enterprise-bank chrome; keep copy plain and human.
- **Don't** use `border-left` / `border-right` greater than 1px as a colored accent stripe on cards, alerts, or list items.
- **Don't** use gradient text (`background-clip: text`) or decorative glassmorphism.
- **Don't** lighten Muted Ink back toward the shadcn default; it must clear 4.5:1 on white.
- **Don't** nest cards, or lift surfaces with heavy 2014-style drop shadows.
- **Don't** introduce a second type family or a display font in UI labels, buttons, or data.
