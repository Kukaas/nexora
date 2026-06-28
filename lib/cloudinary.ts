import "server-only";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Whether the server has the credentials it needs to talk to Cloudinary. The
 * QR-upload UI checks this before offering an upload, so it can degrade to a
 * plain-language notice instead of failing on submit.
 */
export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

/**
 * Upload an image `File` (from a form submission) into a Cloudinary folder and
 * return its secure URL. We never expose an unsigned preset to the browser: the
 * file is posted to a server action, which streams it here using the
 * secret-signed SDK. Throws if uploads aren't configured or the upload fails so
 * callers can surface a plain-language error.
 */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Image uploads aren't configured on the server.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${bytes.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image",
  });

  return result.secure_url;
}

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
