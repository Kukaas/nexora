"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCw } from "lucide-react";

import { Spinner } from "@/components/ui/spinner";
import { uploadResidentIdImage } from "@/lib/resident-actions";

const MAX_ID_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Native device/file-manager image picker shared by resident setup and ID
 * resubmission. The selected file is sent to an authenticated Server Action,
 * which uploads it to the private application-owned Cloudinary folder.
 */
export function IdPhotoUpload({
  value,
  disabled,
  onUploaded,
  onError,
}: {
  value: string | undefined;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onError: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadDisabled = disabled || uploading;

  const chooseFile = () => fileRef.current?.click();

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_ID_IMAGE_BYTES) {
      onError();
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.set("image", file);

    try {
      const result = await uploadResidentIdImage(formData);
      if (!result.ok) {
        onError();
        return;
      }
      onUploaded(result.url);
    } catch {
      onError();
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-3">
          {/* Cloudinary delivery URL; plain img avoids remotePatterns config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Your uploaded ID"
            className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-foreground/10"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-4 text-primary" aria-hidden />
              Photo added
            </span>
            <button
              type="button"
              onClick={chooseFile}
              disabled={uploadDisabled}
              aria-busy={uploading}
              className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:text-primary disabled:opacity-50"
            >
              {uploading ? (
                <Spinner className="size-3.5" />
              ) : (
                <RefreshCw className="size-3.5" aria-hidden />
              )}
              {uploading ? "Uploading…" : "Replace photo"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={chooseFile}
          disabled={uploadDisabled}
          aria-busy={uploading}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-input/30 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/30 outline-none disabled:opacity-50"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            {uploading ? <Spinner /> : <Camera className="size-5" aria-hidden />}
          </span>
          <span className="text-sm font-medium text-foreground">
            {uploading ? "Uploading photo…" : "Choose ID photo"}
          </span>
          <span className="text-xs text-muted-foreground">
            Select an image from your device
          </span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploadDisabled}
        onChange={upload}
      />
    </>
  );
}
