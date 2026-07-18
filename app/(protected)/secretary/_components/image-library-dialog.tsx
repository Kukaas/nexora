"use client";

import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteMediaAsset,
  uploadTemplateImage,
} from "@/lib/secretary-actions";
import type { MediaAssetDTO } from "@/lib/documents";

const MAX_IMAGE_MB = 5;

/**
 * The document designer's image picker: a reusable library so the secretary
 * uploads a letterhead/logo/signature once and inserts it into any layout,
 * instead of re-uploading each time. Uploads persist to the media library
 * (see uploadTemplateImage); picking one drops it into the editor.
 */
export function ImageLibraryDialog({
  editor,
  initialAssets,
}: {
  editor: Editor;
  initialAssets: MediaAssetDTO[];
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAssetDTO[]>(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(`Image is too large. Keep it under ${MAX_IMAGE_MB} MB.`);
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.set("image", file);
    const result = await uploadTemplateImage(fd);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAssets((prev) => [{ ...result.asset, createdAt: "" }, ...prev]);
    toast.success("Image added to your library.");
  };

  const insert = (asset: MediaAssetDTO) => {
    editor
      .chain()
      .focus()
      .setFloatingImage({ src: asset.url, alt: asset.name })
      .run();
    setOpen(false);
  };

  const remove = async (asset: MediaAssetDTO) => {
    setDeletingId(asset.id);
    const result = await deleteMediaAsset({ id: asset.id });
    setDeletingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Insert image"
            >
              <ImagePlus />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Insert image</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
          <DialogDescription>
            Pick from your uploaded images, or upload a new one. Images stay in
            the library so you can reuse them across documents.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {assets.length} {assets.length === 1 ? "image" : "images"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Spinner /> : <Upload />}
            Upload image
          </Button>
        </div>

        {assets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No images yet. Upload a letterhead, logo, or signature to reuse.
            </p>
          </div>
        ) : (
          <ul className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-auto sm:grid-cols-3">
            {assets.map((asset) => (
              <li key={asset.id} className="group relative">
                <button
                  type="button"
                  onClick={() => insert(asset)}
                  className="block w-full overflow-hidden rounded-2xl border border-border bg-muted outline-none transition-colors hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/30"
                  title={`Insert ${asset.name}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="aspect-video w-full bg-white object-contain"
                  />
                  <span className="block truncate px-2 py-1.5 text-left text-xs text-muted-foreground">
                    {asset.name}
                  </span>
                </button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-1.5 right-1.5 size-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={deletingId === asset.id}
                  onClick={() => remove(asset)}
                  aria-label={`Remove ${asset.name} from library`}
                >
                  {deletingId === asset.id ? <Spinner /> : <Trash2 />}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={upload}
        />
      </DialogContent>
    </Dialog>
  );
}
