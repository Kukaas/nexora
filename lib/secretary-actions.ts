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

// ── Document types (catalog) ─────────────────────────────────────────────────

const documentTypeSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(2, "Give the document a name.").max(120),
  description: z.string().trim().max(300).optional(),
  fee: z.coerce.number().min(0, "Fee can't be negative.").max(100000),
  turnaroundDays: z.coerce.number().int().min(0).max(60),
  active: z.boolean(),
});

/** Create or update a requestable document type. */
export async function saveDocumentType(
  input: z.infer<typeof documentTypeSchema>,
): Promise<ActionResult> {
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
    updatedById: auth.userId,
  };

  if (id) {
    await prisma.documentType.update({ where: { id }, data });
  } else {
    await prisma.documentType.create({ data });
  }

  revalidateSecretary(auth.userId);
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
  const { id, title, body, category, place, pinned, published } = parsed.data;

  const data = {
    title,
    body,
    category: category as AnnouncementCategory,
    place: place || null,
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
