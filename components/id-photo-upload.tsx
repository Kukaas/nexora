"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Camera, CheckCircle2, RefreshCw } from "lucide-react";

/**
 * Cloudinary-backed ID photo picker, shared by resident setup and ID
 * resubmission. Uploads are signed via `/api/cloudinary/sign` (no preset) and
 * land in `nexora/government_id`; on success it hands back the secure URL.
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
  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/sign"
      options={{
        sources: ["local", "camera"],
        multiple: false,
        maxFiles: 1,
        folder: "nexora/government_id",
        clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "heic"],
        maxFileSize: 10_000_000,
      }}
      onSuccess={(results) => {
        const info = results?.info;
        if (info && typeof info !== "string" && info.secure_url) {
          onUploaded(info.secure_url);
        }
      }}
      onError={onError}
    >
      {({ open }) => {
        if (value) {
          return (
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
                  onClick={() => open()}
                  disabled={disabled}
                  className="flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:text-primary disabled:opacity-50"
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                  Replace photo
                </button>
              </div>
            </div>
          );
        }

        return (
          <button
            type="button"
            onClick={() => open()}
            disabled={disabled}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-input/30 px-4 py-8 text-center transition-colors hover:bg-accent hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/30 outline-none disabled:opacity-50"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Camera className="size-5" aria-hidden />
            </span>
            <span className="text-sm font-medium text-foreground">
              Upload ID photo
            </span>
            <span className="text-xs text-muted-foreground">
              Take a photo or choose from your device
            </span>
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
