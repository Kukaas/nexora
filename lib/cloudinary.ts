import "server-only";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * The Cloudinary public ID embedded in a delivery URL, or null if the URL isn't
 * a recognizable Cloudinary upload. e.g.
 * `https://res.cloudinary.com/x/image/upload/v123/nexora/government_id/ab.jpg`
 * → `nexora/government_id/ab`.
 */
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  if (!match) return null;
  return match[1].replace(/\.[^/.]+$/, ""); // drop the file extension
}

/**
 * Best-effort delete of a previously uploaded asset. Never throws: a failed
 * cleanup shouldn't block the action that replaced the file, it just leaves an
 * orphan to be reaped later.
 */
export async function deleteCloudinaryImage(url: string): Promise<void> {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error("Failed to delete Cloudinary asset", publicId, error);
  }
}
