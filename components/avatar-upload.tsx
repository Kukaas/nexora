"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadResidentAvatarImage } from "@/lib/resident-actions";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

/**
 * Profile-photo picker used on the resident profile edit form. Uploads the
 * chosen file through an authenticated Server Action and reports the resulting
 * URL (or null when removed) up to the form.
 */
export function AvatarUpload({
  value,
  initials,
  disabled,
  onChange,
  onError,
}: {
  value: string | null;
  initials: string;
  disabled?: boolean;
  onChange: (url: string | null) => void;
  onError: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const busy = disabled || uploading;

  const chooseFile = () => fileRef.current?.click();

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES) {
      onError();
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.set("image", file);
    try {
      const result = await uploadResidentAvatarImage(formData);
      if (!result.ok) {
        onError();
        return;
      }
      onChange(result.url);
    } catch {
      onError();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="size-20 ring-1 ring-foreground/10">
          {value ? <AvatarImage src={value} alt="" /> : null}
          <AvatarFallback className="text-lg font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-background/70">
            <Spinner className="size-5" />
          </span>
        )}
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={chooseFile}
          disabled={busy}
          aria-busy={uploading}
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50",
          )}
        >
          <Camera className="size-4" aria-hidden />
          {value ? "Change photo" : "Add photo"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-muted-foreground outline-none transition-colors hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Remove photo
          </button>
        )}
        <span className="text-xs text-muted-foreground">JPG or PNG, up to 5 MB.</span>
      </div>

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
