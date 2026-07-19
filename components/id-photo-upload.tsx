"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, ImageUp, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { uploadResidentIdImage } from "@/lib/resident-actions";

const MAX_ID_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * ID image picker shared by resident setup and ID resubmission. It offers two
 * explicit choices instead of leaning on the OS file dialog (whose "camera vs
 * gallery" prompt is inconsistent across devices): a "Take a photo" button
 * backed by a `capture="environment"` input (opens the rear camera on phones,
 * falls back to a file dialog on desktop) and a "Choose from files" button
 * backed by a plain image input. Either way the selected file is sent to an
 * authenticated Server Action that uploads it to the private, app-owned
 * Cloudinary folder.
 */
export function IdPhotoUpload({
  value,
  disabled,
  onUploaded,
  onError,
  emptyLabel = "Choose ID photo",
  alt = "Your uploaded ID",
}: {
  value: string | undefined;
  disabled?: boolean;
  onUploaded: (url: string) => void;
  onError: () => void;
  /** Call-to-action shown on the empty picker, e.g. "Add the front". */
  emptyLabel?: string;
  /** Alt text for the uploaded thumbnail. */
  alt?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const uploadDisabled = disabled || uploading;

  const takePhoto = () => cameraRef.current?.click();
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
            alt={alt}
            className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-foreground/10"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-4 text-primary" aria-hidden />
              Photo added
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={takePhoto}
                disabled={uploadDisabled}
                aria-busy={uploading}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:text-primary disabled:opacity-50"
              >
                {uploading ? (
                  <Spinner className="size-3.5" />
                ) : (
                  <Camera className="size-3.5" aria-hidden />
                )}
                {uploading ? "Uploading…" : "Retake"}
              </button>
              <button
                type="button"
                onClick={chooseFile}
                disabled={uploadDisabled}
                aria-busy={uploading}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:text-primary disabled:opacity-50"
              >
                <RefreshCw className="size-3.5" aria-hidden />
                Replace
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-dashed bg-input/30 px-3 py-4 text-center sm:px-4 sm:py-5">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
            {uploading ? <Spinner /> : <Camera className="size-4.5" aria-hidden />}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {uploading ? "Uploading photo…" : emptyLabel}
            </span>
            <span className="text-xs text-muted-foreground">
              Use a clear, well-lit photo. JPG or PNG, up to 10 MB.
            </span>
          </div>
          <div className="grid w-full grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              onClick={takePhoto}
              disabled={uploadDisabled}
              aria-busy={uploading}
              className="w-full"
            >
              <Camera className="size-4" aria-hidden />
              Take photo
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={chooseFile}
              disabled={uploadDisabled}
              className="w-full"
            >
              <ImageUp className="size-4" aria-hidden />
              Upload
            </Button>
          </div>
        </div>
      )}

      {/* Rear camera on phones; ignored on desktop, where it opens a file dialog. */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={uploadDisabled}
        onChange={upload}
      />
      {/* Gallery / file manager — no capture, so it never forces the camera. */}
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
