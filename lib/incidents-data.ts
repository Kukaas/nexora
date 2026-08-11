import "server-only";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type IncidentStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CONVERTED_TO_BLOTTER";

export interface IncidentReportDTO {
  id: string;
  reportNumber: string;
  title: string;
  category: string;
  incidentDate: string;
  location: string;
  description: string;
  attachmentUrl: string | null;
  status: IncidentStatus;
  adminNotes: string | null;
  reporterId: string | null;
  reporterName: string;
  reporterContact: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentInput {
  title: string;
  category: string;
  incidentDate: string;
  location: string;
  description: string;
  attachmentUrl?: string;
  reporterContact?: string;
}

function incidentDb() {
  return (prisma as any).incidentReport;
}

function toIncidentDTO(row: any): IncidentReportDTO {
  return {
    id: row.id,
    reportNumber: row.reportNumber,
    title: row.title,
    category: row.category,
    incidentDate: row.incidentDate instanceof Date ? row.incidentDate.toISOString() : new Date(row.incidentDate).toISOString(),
    location: row.location,
    description: row.description,
    attachmentUrl: row.attachmentUrl ?? null,
    status: (row.status as IncidentStatus) || "SUBMITTED",
    adminNotes: row.adminNotes ?? null,
    reporterId: row.reporterId ?? null,
    reporterName: row.reporterName,
    reporterContact: row.reporterContact ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
  };
}

export async function generateReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const db = incidentDb();
    if (!db) return `INC-${year}-0001`;

    const count = await db.count();
    const seq = String(count + 1).padStart(4, "0");
    return `INC-${year}-${seq}`;
  } catch (error) {
    return `INC-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

/**
 * Fetch incident reports filed by a resident.
 */
export async function getResidentIncidents(reporterId: string): Promise<IncidentReportDTO[]> {
  try {
    const db = incidentDb();
    if (!db) return [];

    const rows = await db.findMany({
      where: { reporterId },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(toIncidentDTO);
  } catch (error: any) {
    // Return empty list gracefully if table is pending migration in DB
    return [];
  }
}

/**
 * Fetch all community incident reports for secretary.
 */
export async function getAllIncidents(options?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<IncidentReportDTO[]> {
  try {
    const db = incidentDb();
    if (!db) return [];

    const where: any = {};
    if (options?.status && options.status !== "ALL") {
      where.status = options.status;
    }
    if (options?.category && options.category !== "ALL") {
      where.category = options.category;
    }
    if (options?.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { reportNumber: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { reporterName: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await db.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return rows.map(toIncidentDTO);
  } catch (error: any) {
    // Return empty list gracefully if table is pending migration in DB
    return [];
  }
}

/**
 * Create a new resident incident report.
 */
export async function createResidentIncident(input: CreateIncidentInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const u = session.user as {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    mobileNumber?: string | null;
  };

  const reporterName =
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    u.name?.trim() ||
    "Resident";

  const reportNumber = await generateReportNumber();
  const db = incidentDb();

  const created = await db.create({
    data: {
      reportNumber,
      title: input.title.trim(),
      category: input.category,
      incidentDate: new Date(input.incidentDate),
      location: input.location.trim(),
      description: input.description.trim(),
      attachmentUrl: input.attachmentUrl || null,
      reporterId: u.id,
      reporterName,
      reporterContact: input.reporterContact || u.mobileNumber || null,
      status: "SUBMITTED",
    },
  });

  revalidatePath(`/resident/${u.id}/incidents`);
  return toIncidentDTO(created);
}

/**
 * Fetch a single incident report by ID.
 */
export async function getIncidentReportById(id: string): Promise<IncidentReportDTO | null> {
  try {
    const db = incidentDb();
    if (!db) return null;

    const row = await db.findUnique({
      where: { id },
    });

    return row ? toIncidentDTO(row) : null;
  } catch (error) {
    console.error(`Error fetching incident report ${id}:`, error);
    return null;
  }
}

/**
 * Update incident status or admin notes (for Secretary/Officials).
 */
export async function updateIncidentStatus(
  incidentId: string,
  input: { status?: IncidentStatus; adminNotes?: string }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const db = incidentDb();

  const updated = await db.update({
    where: { id: incidentId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
    },
  });

  revalidatePath(`/secretary/${session.user.id}/incidents`);
  return toIncidentDTO(updated);
}

/**
 * Update resident incident report details (when status is SUBMITTED).
 */
export async function updateResidentIncident(
  incidentId: string,
  input: {
    title?: string;
    category?: string;
    incidentDate?: string;
    location?: string;
    description?: string;
    attachmentUrl?: string | null;
    reporterContact?: string | null;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const db = incidentDb();

  const existing = await db.findUnique({ where: { id: incidentId } });
  if (!existing || existing.reporterId !== session.user.id) {
    throw new Error("Incident report not found or access denied.");
  }

  if (existing.status !== "SUBMITTED") {
    throw new Error("Only submitted reports pending review can be edited.");
  }

  const updated = await db.update({
    where: { id: incidentId },
    data: {
      ...(input.title ? { title: input.title.trim() } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.incidentDate ? { incidentDate: new Date(input.incidentDate) } : {}),
      ...(input.location ? { location: input.location.trim() } : {}),
      ...(input.description ? { description: input.description.trim() } : {}),
      ...(input.attachmentUrl !== undefined ? { attachmentUrl: input.attachmentUrl } : {}),
      ...(input.reporterContact !== undefined ? { reporterContact: input.reporterContact } : {}),
    },
  });

  revalidatePath(`/resident/${session.user.id}/incidents`);
  revalidatePath(`/resident/${session.user.id}/incidents/${incidentId}`);

  return toIncidentDTO(updated);
}
