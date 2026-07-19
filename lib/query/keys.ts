/**
 * The shared vocabulary for the client cache + realtime invalidation. Query keys
 * identify a cached dataset; invalidation topics are the strings the server emits
 * over the socket when that dataset changes. `topicToQueryKey` maps one to the
 * other so a mutation only has to name a topic and every open client knows which
 * query to refetch.
 *
 * Keep this list in sync as more datasets go realtime — a mutation emits a topic
 * (lib/realtime/emit.ts), the invalidator (components/realtime) looks it up here.
 */
export const queryKeys = {
  /** The signed-in resident's own document requests (keyed by session, not id). */
  residentRequests: ["resident", "requests"] as const,
} as const;

export const INVALIDATION_TOPICS = {
  /** A resident's own document requests changed (the React Query cached list). */
  residentRequests: "resident-requests",
  /**
   * A resident's verification/residency state changed (ID approved, rejected, or
   * resubmitted). This gates server-rendered UI — the overview's request tools vs
   * review notice, and the locked sidebar item — so it triggers a router.refresh
   * rather than a query invalidation.
   */
  residentStatus: "resident-status",
  /**
   * An announcement was published, edited, or removed. The resident feed (overview
   * preview + the announcements page) is server-rendered, so this refreshes it.
   */
  announcements: "announcements",
  /**
   * A document request changed in a way the officials' consoles care about — a new
   * submission, an edit/resubmission, a payment verified, or a document marked
   * ready/claimed. Emitted to the "officials" room; their server-rendered queues
   * (secretary requests, treasurer payments, captain oversight) refresh.
   */
  officialsRequests: "officials-requests",
  /**
   * The user directory changed — a resident completed setup, an official was
   * created, or a verification/role change landed. Emitted to the "officials"
   * room; the admin's residents/officials/activity lists refresh.
   */
  adminUsers: "admin-users",
} as const;

export type InvalidationTopic =
  (typeof INVALIDATION_TOPICS)[keyof typeof INVALIDATION_TOPICS];

/**
 * Topics whose data lives in server components (not the React Query cache), so
 * the client answers them with a router.refresh() to re-run the server render.
 */
export const REFRESH_TOPICS: ReadonlySet<string> = new Set<string>([
  INVALIDATION_TOPICS.residentStatus,
  INVALIDATION_TOPICS.announcements,
  INVALIDATION_TOPICS.officialsRequests,
  INVALIDATION_TOPICS.adminUsers,
]);

/** The query key a realtime topic should invalidate, or null if unrecognized. */
export function topicToQueryKey(topic: string): readonly unknown[] | null {
  switch (topic) {
    case INVALIDATION_TOPICS.residentRequests:
      return queryKeys.residentRequests;
    default:
      return null;
  }
}
