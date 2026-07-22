"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hasAccess } from "@/lib/roles";
import { emitInvalidate } from "@/lib/realtime/emit";
import { INVALIDATION_TOPICS } from "@/lib/query/keys";
import { generateVerificationCode } from "@/lib/verification";
import {
  AnnouncementCategory,
  DocumentRequestStatus,
  PaymentMethodType,
  Purok,
  UserRoles,
} from "@/app/generated/prisma/enums";
import {
  DOCUMENT_FIELD_TYPES,
  isWithinLibtangin,
  parseDocumentFields,
  type DocumentFieldValue,
} from "@/lib/documents";
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
    select: { status: true, requesterId: true },
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

  emitInvalidate(INVALIDATION_TOPICS.residentRequests, {
    toUser: existing.requesterId,
  });
  emitInvalidate(INVALIDATION_TOPICS.officialsRequests, { toOfficials: true });
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
    select: { status: true, requesterId: true },
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

  emitInvalidate(INVALIDATION_TOPICS.residentRequests, {
    toUser: existing.requesterId,
  });
  emitInvalidate(INVALIDATION_TOPICS.officialsRequests, { toOfficials: true });
  revalidateSecretary(auth.userId);
  return { ok: true };
}

const walkInRequestSchema = z.object({
  documentTypeId: z.string().min(1),
  purpose: z.string().trim().max(300).optional(),
  // Answers to the document's custom fields, keyed by field id.
  answers: z.record(z.string(), z.string()).optional(),
});

/**
 * The secretary encodes a request at the desk for a resident who has no
 * account. It starts at PENDING like any other request, but carries no payment
 * yet: the resident takes the reference number (on a printed slip or written
 * down) to the treasurer, who records how it was actually paid — cash or
 * e-wallet — when verifying. A null `requesterId` is what marks it a walk-in.
 */
export async function createWalkInRequest(
  input: z.infer<typeof walkInRequestSchema>,
): Promise<
  | { ok: true; id: string; referenceNumber: string }
  | { ok: false; error: string }
> {
  const auth = await requireSecretary();
  if (!auth.ok) return auth;

  const parsed = walkInRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Please check the details and try again.",
    };
  }
  const { documentTypeId, purpose } = parsed.data;

  const docType = await prisma.documentType.findUnique({
    where: { id: documentTypeId },
    select: { id: true, name: true, fee: true, active: true, fields: true },
  });
  if (!docType || !docType.active) {
    return { ok: false, error: "That document isn't available to request right now." };
  }

  // Validate the answers against the catalog fields and snapshot label/type/
  // value onto the request, exactly like a resident's own submission.
  const answers = parsed.data.answers ?? {};
  const fields = parseDocumentFields(docType.fields);
  const fieldValues: DocumentFieldValue[] = [];
  for (const field of fields) {
    const value = (answers[field.id] ?? "").trim();
    if (field.required && !value) {
      return { ok: false, error: `Please fill in "${field.label}".` };
    }
    if (
      value &&
      field.type === "select" &&
      field.options.length > 0 &&
      !field.options.includes(value)
    ) {
      return { ok: false, error: `Choose a valid option for "${field.label}".` };
    }
    fieldValues.push({ label: field.label, type: field.type, value });
  }

  // The resident's name isn't asked for separately — the document carries its
  // own name field (e.g. "Full name"). Use that answer to label the request in
  // lists and on the payment slip, falling back only if the document has no
  // name field at all.
  const nameValue = fieldValues.find(
    (f) => f.type === "text" && f.label.toLowerCase().includes("name") && f.value,
  )?.value;
  const requesterName = nameValue || "Walk-in resident";

  const referenceNumber = await uniqueReference();
  const verificationCode = await generateVerificationCode();

  // Start the payment as CASH; the treasurer re-stamps the actual method (cash
  // or e-wallet paid at the desk) when they verify the payment.
  const created = await prisma.documentRequest.create({
    data: {
      referenceNumber,
      verificationCode,
      documentTypeId: docType.id,
      documentName: docType.name,
      fee: docType.fee,
      purpose: purpose || null,
      fieldValues,
      method: PaymentMethodType.CASH,
      requesterId: null,
      requesterName,
    },
    select: { id: true },
  });

  emitInvalidate(INVALIDATION_TOPICS.officialsRequests, { toOfficials: true });
  revalidatePath(`/secretary/${auth.userId}/requests`);
  revalidatePath("/treasurer", "layout");
  return { ok: true, id: created.id, referenceNumber };
}

/**
 * A short, human-readable reference like `BRGY-2026-04217`, matching the format
 * resident submissions get (see lib/document-actions.ts). Retries on the rare
 * chance two requests draw the same random suffix in the same year.
 */
async function uniqueReference(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = String(Math.floor(10000 + Math.random() * 90000));
    const candidate = `BRGY-${year}-${suffix}`;
    const taken = await prisma.documentRequest.findUnique({
      where: { referenceNumber: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  return `BRGY-${year}-${Date.now().toString().slice(-6)}`;
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
//
// Two roles write announcements: the secretary (or an admin), who can address
// the whole barangay or any purok, and a kagawad, who is locked to the purok
// the admin assigned them. `requireAnnouncer` resolves which of the two the
// caller is; every announcement action funnels through it.

const PUROK_VALUES = Object.values(Purok) as [Purok, ...Purok[]];

type AnnouncerAuth =
  | { ok: true; userId: string; scope: "all" }
  | { ok: true; userId: string; scope: "purok"; purok: Purok }
  | { ok: false; error: string };

/**
 * Confirm the caller may write announcements. A secretary/admin gets the "all"
 * scope; a kagawad gets a scope pinned to their assigned purok (and is refused
 * while no purok is assigned, since their notices would have no audience).
 */
async function requireAnnouncer(): Promise<AnnouncerAuth> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Your session has expired. Sign in again." };
  }
  const roles = session.user.roles as UserRoles[] | undefined;
  if (hasAccess(roles, UserRoles.SECRETARY)) {
    return { ok: true, userId: session.user.id, scope: "all" };
  }
  if (roles?.includes(UserRoles.KAGAWAD)) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { purok: true },
    });
    if (!user?.purok) {
      return {
        ok: false,
        error:
          "You don't have an assigned purok yet. Ask the administrator to set one before posting.",
      };
    }
    return {
      ok: true,
      userId: session.user.id,
      scope: "purok",
      purok: user.purok,
    };
  }
  return { ok: false, error: "You don't have permission to do that." };
}

/** Refresh every surface that lists announcements, whoever authored them. */
function revalidateAnnouncements(userId: string) {
  revalidatePath(`/secretary/${userId}`);
  revalidatePath(`/secretary/${userId}/announcements`);
  revalidatePath(`/kagawad/${userId}`);
  revalidatePath(`/kagawad/${userId}/announcements`);
  revalidatePath("/resident");
  // Push residents currently in the portal to refresh their feed live. Broadcast
  // (not room-scoped) since a notice can target any purok / all residents.
  emitInvalidate(INVALIDATION_TOPICS.announcements);
}

const announcementSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(3, "Give the notice a title.").max(160),
  body: z.string().trim().min(3, "Add the notice details.").max(4000),
  category: z.enum(
    Object.values(AnnouncementCategory) as [string, ...string[]],
  ),
  place: z.string().trim().max(160).optional(),
  // The picked map point. Both must be present together and fall inside the
  // Libtangin box; a point outside it is rejected rather than silently clamped.
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // The event/advisory date as "yyyy-MM-dd"; optional for ongoing notices.
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.")
    .optional(),
  // Event start/end times as 24-hour "HH:MM" (what <input type="time"> emits).
  startTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a valid start time.")
    .optional(),
  endTime: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a valid end time.")
    .optional(),
  // Cloudinary URL of an already-uploaded event image; optional.
  imageUrl: z.string().url().optional(),
  // The purok the notice targets; omitted means barangay-wide. Ignored for a
  // kagawad, whose assigned purok always wins.
  purok: z.enum(PUROK_VALUES).optional(),
  pinned: z.boolean(),
  published: z.boolean(),
}).superRefine((val, ctx) => {
  const hasLat = val.latitude !== undefined;
  const hasLng = val.longitude !== undefined;
  if (hasLat !== hasLng) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pick a point on the map, or leave it empty.",
      path: ["latitude"],
    });
    return;
  }
  if (hasLat && hasLng && !isWithinLibtangin(val.longitude!, val.latitude!)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Choose a spot inside Barangay Libtangin.",
      path: ["latitude"],
    });
  }
});

const MAX_ANNOUNCEMENT_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Upload an event image for an announcement and return its Cloudinary URL, the
 * same FormData → Server Action → Cloudinary flow the QR and proof uploads use.
 * The form holds the returned URL and persists it on save; a replaced image's
 * old asset is cleaned up in `saveAnnouncement`.
 */
export async function uploadAnnouncementImage(formData: FormData): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  const auth = await requireAnnouncer();
  if (!auth.ok) return auth;

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "That file isn't an image." };
  }
  if (file.size > MAX_ANNOUNCEMENT_IMAGE_BYTES) {
    return { ok: false, error: "That image is too large. Keep it under 8 MB." };
  }

  try {
    const url = await uploadImage(file, "nexora/announcement");
    return { ok: true, url };
  } catch (error) {
    console.error("uploadAnnouncementImage failed", error);
    return { ok: false, error: "The image couldn't be uploaded. Try again." };
  }
}

/** Create or update an announcement. */
export async function saveAnnouncement(
  input: z.infer<typeof announcementSchema>,
): Promise<ActionResult> {
  const auth = await requireAnnouncer();
  if (!auth.ok) return auth;

  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the details and try again.",
    };
  }
  const {
    id,
    title,
    body,
    category,
    place,
    latitude,
    longitude,
    date,
    startTime,
    endTime,
    imageUrl,
    pinned,
    published,
  } = parsed.data;

  // A kagawad's notices always target their own purok, whatever the client
  // sent; the secretary targets whichever purok they picked (or the barangay).
  const purok =
    auth.scope === "purok" ? auth.purok : (parsed.data.purok ?? null);

  const data = {
    title,
    body,
    category: category as AnnouncementCategory,
    place: place || null,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    // Store at UTC midnight; the barangay runs on a single time zone (UTC+8), so
    // the calendar day never shifts when it's read back.
    date: date ? new Date(`${date}T00:00:00Z`) : null,
    startTime: startTime || null,
    // An end time only means something alongside a start; drop a stray end.
    endTime: startTime ? endTime || null : null,
    imageUrl: imageUrl || null,
    purok,
    pinned,
    published,
    authorId: auth.userId,
  };

  if (id) {
    // If the editor swapped or removed the image, reap the old Cloudinary asset
    // after the row is safely updated so we never leave the record pointing at a
    // deleted file (best-effort; a failed cleanup just leaves an orphan).
    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { imageUrl: true, purok: true },
    });
    if (!existing) {
      return { ok: false, error: "That announcement no longer exists." };
    }
    // A kagawad may only edit notices addressed to their own purok.
    if (auth.scope === "purok" && existing.purok !== auth.purok) {
      return { ok: false, error: "You can only edit your purok's announcements." };
    }
    await prisma.announcement.update({ where: { id }, data });
    if (existing.imageUrl && existing.imageUrl !== data.imageUrl) {
      await deleteCloudinaryImage(existing.imageUrl);
    }
  } else {
    await prisma.announcement.create({ data });
  }

  revalidateAnnouncements(auth.userId);
  return { ok: true };
}

/** Delete an announcement outright. */
export async function deleteAnnouncement(input: {
  id: string;
}): Promise<ActionResult> {
  const auth = await requireAnnouncer();
  if (!auth.ok) return auth;

  const existing = await prisma.announcement.findUnique({
    where: { id: input.id },
    select: { purok: true },
  });
  if (!existing) return { ok: true };
  // A kagawad may only delete notices addressed to their own purok.
  if (auth.scope === "purok" && existing.purok !== auth.purok) {
    return { ok: false, error: "You can only delete your purok's announcements." };
  }

  const deleted = await prisma.announcement.delete({ where: { id: input.id } });
  // Reap the event image too, so deleting a notice doesn't orphan its asset.
  if (deleted.imageUrl) await deleteCloudinaryImage(deleted.imageUrl);
  revalidateAnnouncements(auth.userId);
  return { ok: true };
}
