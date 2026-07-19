/**
 * The admin activity feed: a single, time-ordered stream of what's happening in
 * the barangay — residents registering, IDs submitted and reviewed, document
 * requests moving through the queue, and announcements going out.
 *
 * There's no dedicated audit table; instead we derive events from the records
 * each action already writes (users, IDs, document requests, announcements) and
 * merge them into one list. That means the feed reflects all existing history
 * immediately, and it stays live for free: every action that creates one of
 * these rows emits a realtime `REFRESH_TOPIC` to the officials' room, so the
 * server-rendered activity page re-runs and picks the new events up (see
 * lib/realtime/emit.ts and components/realtime/realtime-invalidator.tsx).
 */
import "server-only";

import { prisma } from "@/lib/prisma";
import {
  DocumentRequestStatus,
  IDStatus,
  UserRoles,
} from "@/app/generated/prisma/enums";
import { displayName, primaryRole } from "./_data";

/** Every kind of thing the feed can report, one per row it renders. */
export type ActivityKind =
  | "resident_joined"
  | "official_created"
  | "id_submitted"
  | "id_approved"
  | "id_rejected"
  | "request_submitted"
  | "request_processing"
  | "request_ready"
  | "request_claimed"
  | "request_rejected"
  | "announcement_posted";

/** One normalized event, flattened from whichever table it came from. */
export type ActivityFeedEvent = {
  /** Stable, unique across every source (e.g. `reqsub-<id>`). */
  id: string;
  kind: ActivityKind;
  /** The person the event is about — a resident, an official, or an author. */
  actorName: string;
  /** Their role, used for the avatar/label tint. */
  actorRole: UserRoles;
  /** The thing acted on: a document name or announcement title; null if none. */
  subject: string | null;
  /** A request's reference number, shown as a chip; null for other kinds. */
  reference: string | null;
  /** When it happened — what the whole feed sorts by, newest first. */
  at: Date;
};

/** Map a reviewed request's status to the event kind that describes it. */
function requestStatusKind(status: DocumentRequestStatus): ActivityKind | null {
  switch (status) {
    case DocumentRequestStatus.PROCESSING:
      return "request_processing";
    case DocumentRequestStatus.READY:
      return "request_ready";
    case DocumentRequestStatus.CLAIMED:
      return "request_claimed";
    case DocumentRequestStatus.REJECTED:
      return "request_rejected";
    // PENDING is the just-submitted state, already covered by request_submitted.
    default:
      return null;
  }
}

/**
 * Build the most recent `limit` activity events across all sources. Each source
 * is capped at `limit` on its own (so no single busy source can crowd the others
 * out of the query), then everything is merged, sorted newest-first, and the top
 * `limit` returned.
 */
export async function getActivityFeed(limit: number): Promise<ActivityFeedEvent[]> {
  const [joins, idSubmissions, idDecisions, requests, requestDecisions, announcements] =
    await Promise.all([
      // Accounts that joined — residents who registered, officials we created.
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          roles: true,
          createdAt: true,
        },
      }),
      // IDs submitted for verification (setup or a resubmission).
      prisma.iD.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          createdAt: true,
          user: {
            select: { name: true, firstName: true, lastName: true, email: true, roles: true },
          },
        },
      }),
      // IDs an official has since approved or rejected.
      prisma.iD.findMany({
        where: { reviewedAt: { not: null } },
        orderBy: { reviewedAt: "desc" },
        take: limit,
        select: {
          id: true,
          status: true,
          reviewedAt: true,
          user: {
            select: { name: true, firstName: true, lastName: true, email: true, roles: true },
          },
        },
      }),
      // Document requests as they're submitted.
      prisma.documentRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          referenceNumber: true,
          documentName: true,
          requesterName: true,
          createdAt: true,
        },
      }),
      // Requests that have since moved on (verified, ready, claimed, rejected).
      prisma.documentRequest.findMany({
        where: { reviewedAt: { not: null } },
        orderBy: { reviewedAt: "desc" },
        take: limit,
        select: {
          id: true,
          status: true,
          referenceNumber: true,
          documentName: true,
          requesterName: true,
          reviewedAt: true,
          releasedAt: true,
        },
      }),
      // Announcements posted to the community.
      prisma.announcement.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: { name: true, firstName: true, lastName: true, email: true, roles: true },
          },
        },
      }),
    ]);

  const events: ActivityFeedEvent[] = [];

  for (const u of joins) {
    const role = primaryRole(u.roles);
    events.push({
      id: `join-${u.id}`,
      kind: role === UserRoles.RESIDENT ? "resident_joined" : "official_created",
      actorName: displayName(u),
      actorRole: role,
      subject: null,
      reference: null,
      at: u.createdAt,
    });
  }

  for (const id of idSubmissions) {
    events.push({
      id: `idsub-${id.id}`,
      kind: "id_submitted",
      actorName: displayName(id.user),
      actorRole: primaryRole(id.user.roles),
      subject: null,
      reference: null,
      at: id.createdAt,
    });
  }

  for (const id of idDecisions) {
    if (!id.reviewedAt) continue;
    events.push({
      id: `idrev-${id.id}`,
      kind: id.status === IDStatus.APPROVED ? "id_approved" : "id_rejected",
      actorName: displayName(id.user),
      actorRole: primaryRole(id.user.roles),
      subject: null,
      reference: null,
      at: id.reviewedAt,
    });
  }

  for (const r of requests) {
    events.push({
      id: `reqsub-${r.id}`,
      kind: "request_submitted",
      actorName: r.requesterName,
      actorRole: UserRoles.RESIDENT,
      subject: r.documentName,
      reference: r.referenceNumber,
      at: r.createdAt,
    });
  }

  for (const r of requestDecisions) {
    const kind = requestStatusKind(r.status);
    if (!kind || !r.reviewedAt) continue;
    events.push({
      id: `reqrev-${r.id}`,
      kind,
      actorName: r.requesterName,
      actorRole: UserRoles.RESIDENT,
      subject: r.documentName,
      reference: r.referenceNumber,
      // A claimed document is stamped when released; fall back to the review time.
      at: r.releasedAt ?? r.reviewedAt,
    });
  }

  for (const a of announcements) {
    events.push({
      id: `ann-${a.id}`,
      kind: "announcement_posted",
      actorName: a.author ? displayName(a.author) : "Barangay",
      actorRole: a.author ? primaryRole(a.author.roles) : UserRoles.ADMIN,
      subject: a.title,
      reference: null,
      at: a.createdAt,
    });
  }

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit);
}
