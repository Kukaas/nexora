"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSession } from "@/lib/session";
import { isOfficial } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { uploadAttachment } from "@/lib/cloudinary";
import { emitNewMessage } from "@/lib/realtime/emit";
import type { ChatMessageDTO } from "@/lib/realtime/events";
import { MessageKind, type UserRoles } from "@/app/generated/prisma/enums";

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const messageSchema = z
  .object({
    kind: z.enum(["TEXT", "IMAGE", "FILE"]),
    body: z.string().trim().max(4000).optional(),
    attachmentUrl: z.string().url().optional(),
    attachmentName: z.string().max(255).optional(),
    attachmentSize: z.number().int().nonnegative().optional(),
  })
  .refine((v) => (v.kind === "TEXT" ? Boolean(v.body) : Boolean(v.attachmentUrl)), {
    message: "Message can't be empty.",
  });

export type MessageInput = z.input<typeof messageSchema>;
export type SendResult =
  | { ok: true; message: ChatMessageDTO }
  | { ok: false; error: string };

export type UploadAttachmentResult =
  | { ok: true; url: string; name: string; size: number; kind: "IMAGE" | "FILE" }
  | { ok: false; error: string };

/** Upload an image or file for a chat message through the authenticated server. */
export async function uploadChatAttachment(
  formData: FormData,
): Promise<UploadAttachmentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to send." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: "Keep attachments under 15 MB." };
  }

  try {
    const { url } = await uploadAttachment(file, "nexora/chat");
    const kind = file.type.startsWith("image/") ? "IMAGE" : "FILE";
    return { ok: true, url, name: file.name, size: file.size, kind };
  } catch (error) {
    console.error("uploadChatAttachment failed", error);
    return { ok: false, error: "The file couldn't be uploaded. Try again." };
  }
}

/** Full display name + avatar for the signed-in sender, from the session. */
function senderIdentity(session: Awaited<ReturnType<typeof getSession>>) {
  const user = session!.user as {
    name?: string | null;
    email: string;
    image?: string | null;
  };
  return {
    name: user.name?.trim() || user.email,
    image: user.image ?? null,
  };
}

function buildDTO(args: {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderImage: string | null;
  senderIsOfficial: boolean;
  data: z.infer<typeof messageSchema>;
  createdAt: Date;
}): ChatMessageDTO {
  const { data } = args;
  return {
    id: args.id,
    conversationId: args.conversationId,
    senderId: args.senderId,
    senderName: args.senderName,
    senderImage: args.senderImage,
    senderIsOfficial: args.senderIsOfficial,
    kind: data.kind,
    body: data.kind === "TEXT" ? data.body ?? null : data.body?.trim() || null,
    attachmentUrl: data.attachmentUrl ?? null,
    attachmentName: data.attachmentName ?? null,
    attachmentSize: data.attachmentSize ?? null,
    createdAt: args.createdAt.toISOString(),
  };
}

/** A resident sends into their own desk thread, creating it on first message. */
export async function sendResidentMessage(
  input: MessageInput,
): Promise<SendResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your message." };
  }
  const data = parsed.data;
  const residentId = session.user.id;

  const convo = await prisma.conversation.upsert({
    where: { residentId },
    update: {},
    create: { residentId },
    select: { id: true },
  });

  const now = new Date();
  const created = await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: residentId,
      kind: data.kind as MessageKind,
      body: data.kind === "TEXT" ? data.body ?? null : data.body?.trim() || null,
      attachmentUrl: data.attachmentUrl ?? null,
      attachmentName: data.attachmentName ?? null,
      attachmentSize: data.attachmentSize ?? null,
      createdAt: now,
    },
    select: { id: true },
  });

  await prisma.conversation.update({
    where: { id: convo.id },
    data: { lastMessageAt: now, residentReadAt: now },
  });

  const { name, image } = senderIdentity(session);
  const message = buildDTO({
    id: created.id,
    conversationId: convo.id,
    senderId: residentId,
    senderName: name,
    senderImage: image,
    senderIsOfficial: false,
    data,
    createdAt: now,
  });

  emitNewMessage(residentId, message);
  revalidatePath(`/resident/${residentId}/messages`);
  revalidatePath("/messages");
  return { ok: true, message };
}

/** An official replies into a resident's desk thread. */
export async function sendOfficialMessage(
  input: MessageInput & { conversationId: string },
): Promise<SendResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session expired. Sign in again." };
  if (!isOfficial(session.user.roles as UserRoles[] | undefined)) {
    return { ok: false, error: "You don't have permission to reply here." };
  }

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your message." };
  }
  const data = parsed.data;

  const convo = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true, residentId: true },
  });
  if (!convo) return { ok: false, error: "That conversation no longer exists." };

  const officialId = session.user.id;
  const now = new Date();
  const created = await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: officialId,
      kind: data.kind as MessageKind,
      body: data.kind === "TEXT" ? data.body ?? null : data.body?.trim() || null,
      attachmentUrl: data.attachmentUrl ?? null,
      attachmentName: data.attachmentName ?? null,
      attachmentSize: data.attachmentSize ?? null,
      createdAt: now,
    },
    select: { id: true },
  });

  await prisma.conversation.update({
    where: { id: convo.id },
    data: { lastMessageAt: now, officialReadAt: now },
  });

  const { name, image } = senderIdentity(session);
  const message = buildDTO({
    id: created.id,
    conversationId: convo.id,
    senderId: officialId,
    senderName: name,
    senderImage: image,
    senderIsOfficial: true,
    data,
    createdAt: now,
  });

  emitNewMessage(convo.residentId, message);
  revalidatePath(`/messages/${convo.id}`);
  revalidatePath("/messages");
  revalidatePath(`/resident/${convo.residentId}/messages`);
  return { ok: true, message };
}

/** Mark the resident's own thread read (clears their unread badge). */
export async function markResidentRead(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  await prisma.conversation.updateMany({
    where: { residentId: session.user.id },
    data: { residentReadAt: new Date() },
  });
}

/** Mark a resident thread read on the officials' side. */
export async function markOfficialRead(conversationId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  if (!isOfficial(session.user.roles as UserRoles[] | undefined)) return;
  await prisma.conversation.updateMany({
    where: { id: conversationId },
    data: { officialReadAt: new Date() },
  });
}
