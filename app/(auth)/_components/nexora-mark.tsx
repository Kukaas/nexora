import { cn } from "@/lib/utils";

/**
 * The Nexora civic emblem: a stamp ring around a simplified barangay-hall
 * facade (pediment + columns). Used as the signature motif across auth and,
 * at low opacity, as the trust-panel watermark. `currentColor` drives the
 * building so callers set the hue (amber on dark, amber on white).
 */
export function NexoraGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <circle cx="16" cy="16" r="11.5" fill="currentColor" opacity="0.1" />
      <path d="M16 6.5 L23.5 12 H8.5 Z" fill="currentColor" />
      <rect x="10.25" y="13.2" width="2.1" height="7.1" rx="0.4" fill="currentColor" />
      <rect x="14.95" y="13.2" width="2.1" height="7.1" rx="0.4" fill="currentColor" />
      <rect x="19.65" y="13.2" width="2.1" height="7.1" rx="0.4" fill="currentColor" />
      <rect x="8.2" y="21.1" width="15.6" height="2.1" rx="1" fill="currentColor" />
    </svg>
  );
}

export function NexoraMark({
  className,
  glyphClassName,
  wordClassName,
}: {
  className?: string;
  glyphClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 font-semibold tracking-tight",
        className,
      )}
    >
      <NexoraGlyph className={cn("size-8 text-primary", glyphClassName)} />
      <span className={cn("text-xl", wordClassName)}>Nexora</span>
    </span>
  );
}
