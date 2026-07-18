import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The Nexora brand marks, backed by the logo art in /public.
 *
 * `NexoraGlyph` is the emblem alone (amber "N" barangay-hall monogram,
 * transparent background) — safe on light and dark surfaces, and used at low
 * opacity as a watermark. `NexoraMark` is the full lockup with the wordmark;
 * its text is dark ink, so use it on light surfaces only — on dark panels
 * pair `NexoraGlyph` with your own light-colored text instead.
 */

/** Intrinsic size of /logo-only.png. */
const GLYPH = { width: 285, height: 329 };
/** Intrinsic size of /logo-with-text.png. */
const LOCKUP = { width: 864, height: 283 };

export function NexoraGlyph({
  className,
  "aria-hidden": ariaHidden,
}: {
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <Image
      src="/logo-only.png"
      alt=""
      width={GLYPH.width}
      height={GLYPH.height}
      aria-hidden={ariaHidden ?? true}
      className={cn("object-contain", className)}
    />
  );
}

export function NexoraMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-with-text.png"
      alt="Nexora"
      width={LOCKUP.width}
      height={LOCKUP.height}
      className={cn("h-9 w-auto object-contain", className)}
    />
  );
}
