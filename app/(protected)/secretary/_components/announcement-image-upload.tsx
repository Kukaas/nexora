"use client";

import { useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/spinner";
import { uploadAnnouncementImage } from "@/lib/secretary-actions";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Optional event-image picker for the announcement compose form. Uploads the
 * chosen file through an authenticated Server Action (FormData → Cloudinary) and
 * hands the resulting URL back; the form persists it on save. Shows a 16:9
 * preview so the secretary sees the image the way residents will in the feed.
 */
export function AnnouncementImageUpload({
  value,
  disabled,
  onChange,
}: {
  value: string | undefined;
  disabled?: boolean;
  onChange: (url: string | undefined) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const busy = disabled || uploading;

  const choose = () => fileRef.current?.click();

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("That image is too large. Keep it under 8 MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.set("image", file);
    try {
      const result = await uploadAnnouncementImage(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      onChange(result.url);
    } catch {
      toast.error("The image couldn't be uploaded. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="group relative overflow-hidden rounded-3xl ring-1 ring-foreground/10">
          {/* Cloudinary delivery URL; plain img avoids remotePatterns config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Event image preview"
            className="aspect-video w-full object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
              <Spinner />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-foreground/70 to-transparent p-3">
            <button
              type="button"
              onClick={choose}
              disabled={busy}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-background/90 px-3 text-xs font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={busy}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-background/90 px-3 text-xs font-medium text-destructive shadow-sm outline-none transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={choose}
          disabled={busy}
          aria-busy={uploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-input/30 px-4 text-center transition-colors outline-none hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
        >
          <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            {uploading ? <Spinner /> : <ImagePlus className="size-5" aria-hidden />}
          </span>
          <span className="text-sm font-medium text-foreground">
            {uploading ? "Uploading image…" : "Add an event image"}
          </span>
          <span className="text-xs text-muted-foreground">
            Optional. A photo or poster, landscape works best.
          </span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy}
        onChange={upload}
      />
    </div>
  );
}
