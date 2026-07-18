"use client";

import { useState } from "react";
import { Maximize2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Active = { src: string; side: string } | null;

/**
 * The government ID photos on the profile page. Shows the front (and back, when
 * present) as thumbnails; clicking one opens a larger, readable preview so a
 * resident can check the ID on file without leaving the page.
 */
export function IdPreview({
  front,
  back,
  label,
  number,
}: {
  front: string;
  back: string | null;
  label: string;
  number: string;
}) {
  const [active, setActive] = useState<Active>(null);

  return (
    <>
      <div className="flex shrink-0 gap-3 sm:w-44 sm:flex-col">
        <Thumb
          src={front}
          side="Front"
          label={label}
          onOpen={() => setActive({ src: front, side: "Front" })}
        />
        {back && (
          <Thumb
            src={back}
            side="Back"
            label={label}
            onOpen={() => setActive({ src: back, side: "Back" })}
          />
        )}
      </div>

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="gap-4 p-4 sm:max-w-xl">
          <DialogHeader className="px-1">
            <DialogTitle>
              {label}
              {active ? ` — ${active.side}` : ""}
            </DialogTitle>
            <DialogDescription>
              ID number:{" "}
              <span className="font-mono text-foreground">{number}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-2xl bg-muted">
            {active && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={active.src}
                alt={`Your government ID, ${active.side.toLowerCase()}, enlarged`}
                className="max-h-[70vh] w-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Thumb({
  src,
  side,
  label,
  onOpen,
}: {
  src: string;
  side: string;
  label: string;
  onOpen: () => void;
}) {
  return (
    <div className="flex-1 sm:flex-none">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${label}, ${side.toLowerCase()}`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl ring-1 ring-foreground/10 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {/* Cloudinary delivery URL; plain img avoids remotePatterns config. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`Your government ID, ${side.toLowerCase()}`}
          className="aspect-[16/10] w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-all duration-200 group-hover:bg-foreground/25 group-hover:opacity-100">
          <span className="flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm">
            <Maximize2 className="size-4" aria-hidden />
          </span>
        </span>
      </button>
      <p className="mt-1 text-center text-xs text-muted-foreground">{side}</p>
    </div>
  );
}
