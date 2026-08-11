import "server-only";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { UserRoles } from "@/app/generated/prisma/enums";

export type BlotterStatus =
  | "FILED"
  | "MEDIATION_SCHEDULED"
  | "SETTLED"
  | "DISMISSED"
  | "ESCALATED_TO_PNP";

export type IncidentType =
  | "NEIGHBOR_DISPUTE"
  | "NOISE_COMPLAINT"
  | "PHYSICAL_INJURY"
  | "PROPERTY_DAMAGE"
  | "THEFT"
  | "THREATS"
  | "DOMESTIC"
  | "OTHER";

export interface BlotterRecordDTO {
  id: string;
  caseNumber: string;
  incidentType: IncidentType;
  incidentDate: string;
  incidentLocation: string;
  complainantId: string | null;
  complainantName: string;
  complainantContact: string | null;
  complainantEmail?: string | null;
  respondentName: string;
  respondentAddress: string | null;
  narrative: string;
  status: BlotterStatus;
  hearingDate: string | null;
  resolutionNotes: string | null;
  officerInChargeId: string | null;
  officerInChargeName: string | null;
  isConfidential: boolean;
  attachmentUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlotterSummaryDTO {
  totalCases: number;
  filedCount: number;
  mediationCount: number;
  settledCount: number;
  dismissedCount: number;
  escalatedCount: number;
}

export interface CreateBlotterInput {
  incidentType: IncidentType;
  incidentDate: string;
  incidentLocation: string;
  complainantId?: string | null;
  complainantName: string;
  complainantContact?: string | null;
  respondentName: string;
  respondentAddress?: string | null;
  narrative: string;
  isConfidential?: boolean;
  attachmentUrl?: string | null;
}

export interface UpdateBlotterInput {
  status?: BlotterStatus;
  hearingDate?: string | null;
  resolutionNotes?: string | null;
  officerInChargeId?: string | null;
}

/** Formats blotter row into a clean serializable DTO */
function toBlotterDTO(row: any): BlotterRecordDTO {
  const officer = row.officerInCharge;
  const officerName = officer
    ? [officer.firstName, officer.lastName].filter(Boolean).join(" ") || officer.name || null
    : null;

  return {
    id: row.id,
    caseNumber: row.caseNumber,
    incidentType: row.incidentType as IncidentType,
    incidentDate: row.incidentDate instanceof Date ? row.incidentDate.toISOString() : new Date(row.incidentDate).toISOString(),
    incidentLocation: row.incidentLocation,
    complainantId: row.complainantId ?? null,
    complainantName: row.complainantName,
    complainantContact: row.complainantContact ?? null,
    complainantEmail: row.complainant?.email ?? null,
    respondentName: row.respondentName,
    respondentAddress: row.respondentAddress ?? null,
    narrative: row.narrative,
    status: row.status as BlotterStatus,
    hearingDate: row.hearingDate ? new Date(row.hearingDate).toISOString() : null,
    resolutionNotes: row.resolutionNotes ?? null,
    officerInChargeId: row.officerInChargeId ?? null,
    officerInChargeName: officerName,
    isConfidential: Boolean(row.isConfidential),
    attachmentUrl: row.attachmentUrl ?? null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
  };
}

/** Helper to query blotter model via prisma client safely */
function blotterDb() {
  return (prisma as any).blotterRecord;
}

/**
 * Fetch blotter records with optional filters for status, incident type, and search.
 */
export async function getBlotterRecords(options?: {
  status?: string;
  incidentType?: string;
  search?: string;
}): Promise<BlotterRecordDTO[]> {
  try {
    const db = blotterDb();
    if (!db) return [];

    const where: any = {};

    if (options?.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options?.incidentType && options.incidentType !== "ALL") {
      where.incidentType = options.incidentType;
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { caseNumber: { contains: q, mode: "insensitive" } },
        { complainantName: { contains: q, mode: "insensitive" } },
        { respondentName: { contains: q, mode: "insensitive" } },
        { incidentLocation: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await db.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        complainant: { select: { email: true } },
        officerInCharge: { select: { name: true, firstName: true, lastName: true } },
      },
    });

    return rows.map(toBlotterDTO);
  } catch (error) {
    console.error("Error fetching blotter records:", error);
    return [];
  }
}

/**
 * Fetch a single blotter record by ID.
 */
export async function getBlotterRecordById(id: string): Promise<BlotterRecordDTO | null> {
  try {
    const db = blotterDb();
    if (!db) return null;

    const row = await db.findUnique({
      where: { id },
      include: {
        complainant: { select: { email: true } },
        officerInCharge: { select: { name: true, firstName: true, lastName: true } },
      },
    });

    return row ? toBlotterDTO(row) : null;
  } catch (error) {
    console.error(`Error fetching blotter record ${id}:`, error);
    return null;
  }
}

/**
 * Get summary stats for blotter dashboard.
 */
export async function getBlotterSummaryStats(): Promise<BlotterSummaryDTO> {
  try {
    const db = blotterDb();
    if (!db) {
      return { totalCases: 0, filedCount: 0, mediationCount: 0, settledCount: 0, dismissedCount: 0, escalatedCount: 0 };
    }

    const grouped = await db.groupBy({
      by: ["status"],
      _count: true,
    });

    const summary: BlotterSummaryDTO = {
      totalCases: 0,
      filedCount: 0,
      mediationCount: 0,
      settledCount: 0,
      dismissedCount: 0,
      escalatedCount: 0,
    };

    for (const g of grouped) {
      const count = g._count;
      summary.totalCases += count;
      if (g.status === "FILED") summary.filedCount = count;
      if (g.status === "MEDIATION_SCHEDULED") summary.mediationCount = count;
      if (g.status === "SETTLED") summary.settledCount = count;
      if (g.status === "DISMISSED") summary.dismissedCount = count;
      if (g.status === "ESCALATED_TO_PNP") summary.escalatedCount = count;
    }

    return summary;
  } catch (error) {
    console.error("Error getting blotter summary stats:", error);
    return { totalCases: 0, filedCount: 0, mediationCount: 0, settledCount: 0, dismissedCount: 0, escalatedCount: 0 };
  }
}

/**
 * Generates an official machine case number string e.g. BLT-2026-0001
 */
export async function generateCaseNumber(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const db = blotterDb();
    if (!db) return `BLT-${year}-0001`;

    const count = await db.count();
    const seq = String(count + 1).padStart(4, "0");
    return `BLT-${year}-${seq}`;
  } catch (error) {
    return `BLT-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

/**
 * Action / Function: Create a new blotter record.
 */
export async function createBlotterRecord(input: CreateBlotterInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const caseNumber = await generateCaseNumber();
  const db = blotterDb();

  const record = await db.create({
    data: {
      caseNumber,
      incidentType: input.incidentType,
      incidentDate: new Date(input.incidentDate),
      incidentLocation: input.incidentLocation,
      complainantId: input.complainantId || null,
      complainantName: input.complainantName,
      complainantContact: input.complainantContact || null,
      respondentName: input.respondentName,
      respondentAddress: input.respondentAddress || null,
      narrative: input.narrative,
      isConfidential: Boolean(input.isConfidential),
      attachmentUrl: input.attachmentUrl || null,
      status: "FILED",
      officerInChargeId: session.user.id,
    },
  });

  revalidatePath(`/secretary/${session.user.id}/blotter`);
  return toBlotterDTO(record);
}

/**
 * Action / Function: Update blotter record (hearing date, status, resolution).
 */
export async function updateBlotterRecord(blotterId: string, input: UpdateBlotterInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const db = blotterDb();

  const updateData: any = {};
  if (input.status) updateData.status = input.status;
  if (input.hearingDate !== undefined) {
    updateData.hearingDate = input.hearingDate ? new Date(input.hearingDate) : null;
  }
  if (input.resolutionNotes !== undefined) {
    updateData.resolutionNotes = input.resolutionNotes;
  }
  if (input.officerInChargeId !== undefined) {
    updateData.officerInChargeId = input.officerInChargeId;
  }

  const updated = await db.update({
    where: { id: blotterId },
    data: updateData,
  });

  revalidatePath(`/secretary/${session.user.id}/blotter`);
  revalidatePath(`/secretary/${session.user.id}/blotter/${blotterId}`);

  return toBlotterDTO(updated);
}

/**
 * Fetch blotter records filed by a specific resident.
 */
export async function getResidentBlotterRecords(residentId: string): Promise<BlotterRecordDTO[]> {
  try {
    const db = blotterDb();
    if (!db) return [];

    const rows = await db.findMany({
      where: { complainantId: residentId },
      orderBy: { createdAt: "desc" },
      include: {
        complainant: { select: { email: true } },
        officerInCharge: { select: { name: true, firstName: true, lastName: true } },
      },
    });

    return rows.map(toBlotterDTO);
  } catch (error: any) {
    // Return empty list gracefully if attachment_url column or table is pending migration in DB
    return [];
  }
}

/**
 * Action / Function: Resident files a new blotter/incident report.
 */
export async function createResidentBlotterRecord(input: {
  incidentType: IncidentType;
  incidentDate: string;
  incidentLocation: string;
  respondentName: string;
  respondentAddress?: string;
  narrative: string;
  complainantContact?: string;
  isConfidential?: boolean;
  attachmentUrl?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const u = session.user as {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    mobileNumber?: string | null;
  };

  const complainantName =
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    u.name?.trim() ||
    "Verified Resident";

  const caseNumber = await generateCaseNumber();
  const db = blotterDb();

  const record = await db.create({
    data: {
      caseNumber,
      incidentType: input.incidentType,
      incidentDate: new Date(input.incidentDate),
      incidentLocation: input.incidentLocation,
      complainantId: u.id,
      complainantName,
      complainantContact: input.complainantContact || u.mobileNumber || null,
      respondentName: input.respondentName,
      respondentAddress: input.respondentAddress || null,
      narrative: input.narrative,
      isConfidential: Boolean(input.isConfidential),
      attachmentUrl: input.attachmentUrl || null,
      status: "FILED",
    },
  });

  revalidatePath(`/resident/${u.id}/blotter`);
  return toBlotterDTO(record);
}

/**
  * Action / Function: Resident updates a filed blotter report details (when status is FILED).
  */
export async function updateResidentBlotterRecord(
  blotterId: string,
  input: {
    incidentType?: IncidentType;
    incidentDate?: string;
    incidentLocation?: string;
    respondentName?: string;
    respondentAddress?: string | null;
    narrative?: string;
    complainantContact?: string | null;
    isConfidential?: boolean;
    attachmentUrl?: string | null;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const db = blotterDb();

  const existing = await db.findUnique({ where: { id: blotterId } });
  if (!existing || existing.complainantId !== session.user.id) {
    throw new Error("Blotter record not found or access denied.");
  }

  if (existing.status !== "FILED") {
    throw new Error("Only newly filed blotter cases can be edited.");
  }

  const updated = await db.update({
    where: { id: blotterId },
    data: {
      ...(input.incidentType ? { incidentType: input.incidentType } : {}),
      ...(input.incidentDate ? { incidentDate: new Date(input.incidentDate) } : {}),
      ...(input.incidentLocation ? { incidentLocation: input.incidentLocation.trim() } : {}),
      ...(input.respondentName ? { respondentName: input.respondentName.trim() } : {}),
      ...(input.respondentAddress !== undefined ? { respondentAddress: input.respondentAddress } : {}),
      ...(input.narrative ? { narrative: input.narrative.trim() } : {}),
      ...(input.complainantContact !== undefined ? { complainantContact: input.complainantContact } : {}),
      ...(input.isConfidential !== undefined ? { isConfidential: Boolean(input.isConfidential) } : {}),
      ...(input.attachmentUrl !== undefined ? { attachmentUrl: input.attachmentUrl } : {}),
    },
  });

  revalidatePath(`/resident/${session.user.id}/blotter`);
  revalidatePath(`/resident/${session.user.id}/blotter/${blotterId}`);

  return toBlotterDTO(updated);
}
