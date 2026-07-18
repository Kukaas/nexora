import "server-only";

import { prisma } from "@/lib/prisma";
import { OFFICIAL_ROLES } from "@/lib/roles";
import { UserRoles } from "@/app/generated/prisma/enums";
import type { ChatMessageDTO } from "@/lib/realtime/events";

/**
 * Reads for the resident/official message desk. There is one conversation per
 * resident (see the Conversation model); any official can read and reply, so
 * "who sent it" is decided by comparing the sender to the conversation's
 * resident rather than by re-checking roles.
 */

type PersonName = {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
};

function personName(p: PersonName): string {
  return (
    [p.firstName, p.lastName].filter(Boolean).join(" ").trim() ||
    p.name?.trim() ||
    p.email
  );
}

const OFFICIAL_ROLE_ORDER: UserRoles[] = [
  UserRoles.CAPTAIN,
  UserRoles.SECRETARY,
  UserRoles.TREASURER,
  UserRoles.KAGAWAD,
  UserRoles.ADMIN,
];

const OFFICIAL_ROLE_LABEL: Record<UserRoles, string> = {
  [UserRoles.CAPTAIN]: "Barangay Captain",
  [UserRoles.SECRETARY]: "Secretary",
  [UserRoles.TREASURER]: "Treasurer",
  [UserRoles.KAGAWAD]: "Kagawad",
  [UserRoles.ADMIN]: "Administrator",
  [UserRoles.RESIDENT]: "Resident",
};

function primaryOfficialRole(roles: UserRoles[]): UserRoles {
  return OFFICIAL_ROLE_ORDER.find((r) => roles.includes(r)) ?? UserRoles.KAGAWAD;
}

export type OfficialDirectoryEntry = {
  id: string;
  name: string;
  image: string | null;
  role: UserRoles;
  roleLabel: string;
};

/** The barangay officials a resident can see, ranked by office then name. */
export async function getOfficialsDirectory(): Promise<
  OfficialDirectoryEntry[]
> {
  const users = await prisma.user.findMany({
    where: { roles: { hasSome: OFFICIAL_ROLES } },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      roles: true,
    },
  });

  return users
    .map((u) => {
      const role = primaryOfficialRole(u.roles);
      return {
        id: u.id,
        name: personName(u),
        image: u.image,
        role,
        roleLabel: OFFICIAL_ROLE_LABEL[role],
      };
    })
    .sort((a, b) => {
      const byRole =
        OFFICIAL_ROLE_ORDER.indexOf(a.role) -
        OFFICIAL_ROLE_ORDER.indexOf(b.role);
      return byRole !== 0 ? byRole : a.name.localeCompare(b.name);
    });
}

type MessageRow = {
  id: string;
  conversationId: string;
  senderId: string;
  kind: ChatMessageDTO["kind"];
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentSize: number | null;
  createdAt: Date;
  sender: PersonName & { image: string | null };
};

function toMessageDTO(row: MessageRow, residentId: string): ChatMessageDTO {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    senderName: personName(row.sender),
    senderImage: row.sender.image,
    senderIsOfficial: row.senderId !== residentId,
    kind: row.kind,
    body: row.body,
    attachmentUrl: row.attachmentUrl,
    attachmentName: row.attachmentName,
    attachmentSize: row.attachmentSize,
    createdAt: row.createdAt.toISOString(),
  };
}

const MESSAGE_SELECT = {
  id: true,
  conversationId: true,
  senderId: true,
  kind: true,
  body: true,
  attachmentUrl: true,
  attachmentName: true,
  attachmentSize: true,
  createdAt: true,
  sender: {
    select: {
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
    },
  },
} as const;

/** The latest slice of a conversation's messages, oldest-first for rendering. */
async function loadMessages(
  conversationId: string,
  residentId: string,
): Promise<ChatMessageDTO[]> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: MESSAGE_SELECT,
  });
  return rows.reverse().map((r) => toMessageDTO(r, residentId));
}

export type ResidentConversation = {
  conversationId: string | null;
  messages: ChatMessageDTO[];
};

/** A resident's own desk thread. Null id when they haven't messaged yet. */
export async function getResidentConversation(
  residentId: string,
): Promise<ResidentConversation> {
  const convo = await prisma.conversation.findUnique({
    where: { residentId },
    select: { id: true },
  });
  if (!convo) return { conversationId: null, messages: [] };
  return {
    conversationId: convo.id,
    messages: await loadMessages(convo.id, residentId),
  };
}

/** Short preview of a conversation's most recent message for the inbox list. */
function previewOf(
  msg: { kind: ChatMessageDTO["kind"]; body: string | null; attachmentName: string | null } | undefined,
): string {
  if (!msg) return "No messages yet";
  if (msg.kind === "IMAGE") return "Photo";
  if (msg.kind === "FILE") return msg.attachmentName ?? "File";
  return msg.body ?? "";
}

export type InboxItem = {
  conversationId: string;
  resident: { id: string; name: string; image: string | null };
  preview: string;
  lastMessageAt: string;
  lastFromResident: boolean;
  unread: boolean;
};

/** Every resident thread for the officials' shared inbox, newest first. */
export async function getOfficialInbox(): Promise<InboxItem[]> {
  const convos = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    select: {
      id: true,
      residentId: true,
      lastMessageAt: true,
      officialReadAt: true,
      resident: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          kind: true,
          body: true,
          attachmentName: true,
          senderId: true,
          createdAt: true,
        },
      },
    },
  });

  return convos.map((c) => {
    const last = c.messages[0];
    const lastFromResident = last ? last.senderId === c.residentId : false;
    const unread =
      lastFromResident &&
      (c.officialReadAt == null || c.officialReadAt < c.lastMessageAt);
    return {
      conversationId: c.id,
      resident: { id: c.resident.id, name: personName(c.resident), image: c.resident.image },
      preview: previewOf(last),
      lastMessageAt: c.lastMessageAt.toISOString(),
      lastFromResident,
      unread,
    };
  });
}

/** Count of resident threads awaiting an official reply, for the nav badge. */
export async function getOfficialUnreadCount(): Promise<number> {
  const convos = await prisma.conversation.findMany({
    select: {
      residentId: true,
      lastMessageAt: true,
      officialReadAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { senderId: true },
      },
    },
  });
  return convos.filter((c) => {
    const last = c.messages[0];
    return (
      last &&
      last.senderId === c.residentId &&
      (c.officialReadAt == null || c.officialReadAt < c.lastMessageAt)
    );
  }).length;
}

export type OfficialConversation = {
  conversationId: string;
  resident: { id: string; name: string; image: string | null };
  messages: ChatMessageDTO[];
};

/** A single resident thread for an official to read and reply to. */
export async function getOfficialConversation(
  conversationId: string,
): Promise<OfficialConversation | null> {
  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      residentId: true,
      resident: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
        },
      },
    },
  });
  if (!convo) return null;
  return {
    conversationId: convo.id,
    resident: {
      id: convo.resident.id,
      name: personName(convo.resident),
      image: convo.resident.image,
    },
    messages: await loadMessages(convo.id, convo.residentId),
  };
}

/** Whether a resident has any unread official replies, for the nav badge. */
export async function getResidentUnread(residentId: string): Promise<boolean> {
  const convo = await prisma.conversation.findUnique({
    where: { residentId },
    select: {
      lastMessageAt: true,
      residentReadAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { senderId: true },
      },
    },
  });
  if (!convo) return false;
  const last = convo.messages[0];
  return Boolean(
    last &&
      last.senderId !== residentId &&
      (convo.residentReadAt == null || convo.residentReadAt < convo.lastMessageAt),
  );
}
