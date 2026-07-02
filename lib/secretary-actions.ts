"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasAccess } from "@/lib/roles";
import {
  AnnouncementCategory,
  DocumentRequestStatus,
  UserRoles,
} from "@/app/generated/prisma/enums";
import { DOCUMENT_FIELD_TYPES } from "@/lib/documents";
import { deleteCloudinaryImage, uploadImage } from "@/lib/cloudinary";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Confirm the caller may act as secretary (the secretary themselves, or an
 * admin). Returns the acting user's id on success, or an error result.
 */
async function requireSecretary(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }
  const roles = session.user.roles as UserRoles[] | undefined;
  if (!hasAccess(roles, UserRoles.SECRETARY)) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return { ok: true, userId: session.user.id };
}

/** Revalidate every secretary screen that lists requests/types/announcements. */
function revalidateSecretary(userId: string) {
  revalidatePath(`/secretary/${userId}`);
  revalidatePath(`/secretary/${userId}/documents`);
  revalidatePath(`/secretary/${userId}/announcements`);
}

// ── Document requests ───────────────────────────────────────────────────────
//
// Payment verification is the treasurer's job (see reviewDocumentRequest in
// lib/treasurer-actions.ts). The secretary only takes over once the treasurer
// has verified the payment and moved the request into PROCESSING: they prepare
// the document and release it to the resident.

/** Mark a processing request as ready for the resident to claim. */
export async function markRequestReady(input: {
  requestId: string;
}): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const existing = await prisma.documentRequest.findUnique({
    where: { id: input.requestId },
    select: { status: true },
  });
  if (!existing) return { ok: false, error: "That request no longer exists." };
  if (existing.status !== DocumentRequestStatus.PROCESSING) {
    return {
      ok: false,
      error: "Verify the payment before marking the document ready.",
    };
  }

  await prisma.documentRequest.update({
    where: { id: input.requestId },
    data: { status: DocumentRequestStatus.READY, releasedAt: new Date() },
  });

  revalidateSecretary(auth.userId);
  return { ok: true };
}

/** Mark a ready document as claimed once the resident has picked it up. */
export async function markRequestClaimed(input: {
  requestId: string;
}): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const existing = await prisma.documentRequest.findUnique({
    where: { id: input.requestId },
    select: { status: true },
  });
  if (!existing) return { ok: false, error: "That request no longer exists." };
  if (existing.status !== DocumentRequestStatus.READY) {
    return {
      ok: false,
      error: "Only a ready document can be marked as claimed.",
    };
  }

  await prisma.documentRequest.update({
    where: { id: input.requestId },
    data: { status: DocumentRequestStatus.CLAIMED },
  });

  revalidateSecretary(auth.userId);
  return { ok: true };
}

// ── Document types (catalog) ─────────────────────────────────────────────────

const documentFieldSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().trim().min(1, "Give each field a label.").max(80),
  type: z.enum(DOCUMENT_FIELD_TYPES),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
});

const documentTypeSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(2, "Give the document a name.").max(120),
  description: z.string().trim().max(300).optional(),
  fee: z.coerce.number().min(0, "Fee can't be negative.").max(100000),
  turnaroundDays: z.coerce.number().int().min(0).max(60),
  active: z.boolean(),
  fields: z.array(documentFieldSchema).max(20).optional(),
});

/** Create or update a requestable document type. Returns the type's id so the
 * caller can send the secretary straight into the layout designer after adding. */
export async function saveDocumentType(
  input: z.infer<typeof documentTypeSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const parsed = documentTypeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the details and try again.",
    };
  }
  const { id, name, description, fee, turnaroundDays, active } = parsed.data;

  // Normalize the custom fields: stamp an id on new fields, keep options only for
  // dropdowns, and reject a dropdown with no choices to fill in.
  const fields = (parsed.data.fields ?? []).map((field) => ({
    id: field.id ?? crypto.randomUUID(),
    label: field.label,
    type: field.type,
    required: field.required,
    options:
      field.type === "select"
        ? (field.options ?? []).map((o) => o.trim()).filter(Boolean)
        : [],
  }));
  const emptyDropdown = fields.find(
    (field) => field.type === "select" && field.options.length === 0,
  );
  if (emptyDropdown) {
    return {
      ok: false,
      error: `Add at least one choice to the "${emptyDropdown.label}" dropdown.`,
    };
  }

  // Names must be unique; surface a friendly message instead of a DB error.
  const clash = await prisma.documentType.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, id: id ? { not: id } : undefined },
    select: { id: true },
  });
  if (clash) {
    return { ok: false, error: `"${name}" already exists in the catalog.` };
  }

  const data = {
    name,
    description: description || null,
    fee,
    turnaroundDays,
    active,
    fields,
    updatedById: auth.userId,
  };

  const saved = id
    ? await prisma.documentType.update({ where: { id }, data, select: { id: true } })
    : await prisma.documentType.create({ data, select: { id: true } });

  revalidateSecretary(auth.userId);
  return { ok: true, id: saved.id };
}

const documentTemplateSchema = z.object({
  id: z.string().min(1),
  // A designed layout can get large (inline images are URLs, but tables and rich
  // text add up); cap it well above a realistic document to catch runaway input.
  template: z.string().max(500_000),
  paperSize: z.enum(["A4", "Letter", "Legal"]),
  orientation: z.enum(["portrait", "landscape"]),
});

/**
 * Save just the designed layout (Tiptap HTML) for a document type. Kept separate
 * from saveDocumentType so the designer can save the layout without re-sending —
 * and re-validating — the name, fee, and field list.
 */
export async function saveDocumentTemplate(
  input: z.infer<typeof documentTemplateSchema>,
): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const parsed = documentTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "The layout couldn't be saved. Try again." };
  }

  await prisma.documentType.update({
    where: { id: parsed.data.id },
    // Store null (not an empty paragraph) when the layout is cleared, so
    // "has a template?" checks stay simple.
    data: {
      template: parsed.data.template.trim() || null,
      paperSize: parsed.data.paperSize,
      orientation: parsed.data.orientation,
      updatedById: auth.userId,
    },
  });

  revalidateSecretary(auth.userId);
  return { ok: true };
}

/**
 * Upload an image for the document designer and add it to the reusable media
 * library, returning the saved asset so it can be inserted right away. Mirrors
 * the payment-QR / proof upload flow (FormData → Server Action → Cloudinary),
 * secretary-gated.
 */
export async function uploadTemplateImage(formData: FormData): Promise<
  | { ok: true; asset: { id: string; url: string; name: string } }
  | { ok: false; error: string }
> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "That file isn't an image." };
  }

  try {
    const url = await uploadImage(file, "nexora/document-template");
    const name = (file.name || "Image").replace(/\.[^.]+$/, "").slice(0, 120);
    const asset = await prisma.mediaAsset.create({
      data: { url, name, createdById: auth.userId },
      select: { id: true, url: true, name: true },
    });
    return { ok: true, asset };
  } catch {
    return { ok: false, error: "The image couldn't be uploaded. Try again." };
  }
}

/** Remove an image from the media library and delete it from Cloudinary. */
export async function deleteMediaAsset(input: {
  id: string;
}): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.id },
    select: { url: true },
  });
  if (!asset) return { ok: true };

  await deleteCloudinaryImage(asset.url);
  await prisma.mediaAsset.delete({ where: { id: input.id } });
  return { ok: true };
}

/** Turn a document type on or off without opening the editor. */
export async function setDocumentTypeActive(input: {
  id: string;
  active: boolean;
}): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  await prisma.documentType.update({
    where: { id: input.id },
    data: { active: input.active, updatedById: auth.userId },
  });

  revalidateSecretary(auth.userId);
  return { ok: true };
}

/**
 * Delete a document type. Only allowed when nothing references it; otherwise we
 * keep the row (and its history) and suggest turning it off instead.
 */
export async function deleteDocumentType(input: {
  id: string;
}): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const count = await prisma.documentRequest.count({
    where: { documentTypeId: input.id },
  });
  if (count > 0) {
    return {
      ok: false,
      error:
        "Residents have already requested this document, so it can't be deleted. Turn it off to stop new requests.",
    };
  }

  await prisma.documentType.delete({ where: { id: input.id } });
  revalidateSecretary(auth.userId);
  return { ok: true };
}

// ── Announcements ────────────────────────────────────────────────────────────

const announcementSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(3, "Give the notice a title.").max(160),
  body: z.string().trim().min(3, "Add the notice details.").max(4000),
  category: z.enum(
    Object.values(AnnouncementCategory) as [string, ...string[]],
  ),
  place: z.string().trim().max(160).optional(),
  // The event/advisory date as "yyyy-MM-dd"; optional for ongoing notices.
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.")
    .optional(),
  pinned: z.boolean(),
  published: z.boolean(),
});

/** Create or update an announcement. */
export async function saveAnnouncement(
  input: z.infer<typeof announcementSchema>,
): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the details and try again.",
    };
  }
  const { id, title, body, category, place, date, pinned, published } =
    parsed.data;

  const data = {
    title,
    body,
    category: category as AnnouncementCategory,
    place: place || null,
    // Store at UTC midnight; the barangay runs on a single time zone (UTC+8), so
    // the calendar day never shifts when it's read back.
    date: date ? new Date(`${date}T00:00:00Z`) : null,
    pinned,
    published,
    authorId: auth.userId,
  };

  if (id) {
    await prisma.announcement.update({ where: { id }, data });
  } else {
    await prisma.announcement.create({ data });
  }

  revalidateSecretary(auth.userId);
  revalidatePath("/resident");
  return { ok: true };
}

/** Delete an announcement outright. */
export async function deleteAnnouncement(input: {
  id: string;
}): Promise<ActionResult> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  await prisma.announcement.delete({ where: { id: input.id } });
  revalidateSecretary(auth.userId);
  revalidatePath("/resident");
  return { ok: true };
}
