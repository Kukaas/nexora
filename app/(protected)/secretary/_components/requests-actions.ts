"use server";

import { requireRole } from "@/lib/session";
import {
  getDocumentRequestsPage,
  getRequestStatusCounts,
} from "@/lib/secretary-data";
import { UserRoles } from "@/app/generated/prisma/enums";
import type {
  RequestPage,
  RequestQuery,
  RequestStatusCounts,
} from "@/lib/documents";

/**
 * Server actions backing the requests table's incremental loading. The
 * secretary area's layout gates the page, but actions are their own endpoints,
 * so each one re-checks the role before reading anything.
 */

export async function fetchRequestsPage(
  query: RequestQuery,
): Promise<RequestPage> {
  await requireRole(UserRoles.SECRETARY);
  return getDocumentRequestsPage(query);
}

export async function fetchRequestCounts(
  start: string | null,
  end: string | null,
): Promise<RequestStatusCounts> {
  await requireRole(UserRoles.SECRETARY);
  return getRequestStatusCounts(start, end);
}
