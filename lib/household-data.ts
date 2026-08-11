import "server-only";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Purok } from "@/app/generated/prisma/enums";

export type HouseholdRole =
  | "HEAD"
  | "SPOUSE"
  | "CHILD"
  | "PARENT"
  | "RELATIVE"
  | "OTHER";

export interface HouseholdMemberDTO {
  id: string;
  name: string;
  email: string;
  relationshipToHead: HouseholdRole | null;
  mobileNumber: string | null;
  isSenior: boolean;
  isPWD: boolean;
  isSoloParent: boolean;
  is4PsBeneficiary: boolean;
}

export interface HouseholdDTO {
  id: string;
  householdNumber: string;
  purok: Purok;
  streetAddress: string;
  headId: string | null;
  headName: string | null;
  headEmail: string | null;
  members: HouseholdMemberDTO[];
  memberCount: number;
  is4Ps: boolean;
  isIndigent: boolean;
  hasSenior: boolean;
  hasPWD: boolean;
  hasSoloParent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CensusStatsDTO {
  totalHouseholds: number;
  totalPopulation: number;
  total4PsHouseholds: number;
  totalIndigentHouseholds: number;
  totalSeniors: number;
  totalPWDs: number;
  totalSoloParents: number;
  purokBreakdown: Record<string, number>;
}

export interface CreateHouseholdInput {
  householdNumber?: string;
  purok: Purok;
  streetAddress: string;
  headId?: string | null;
  headName?: string;
  is4Ps?: boolean;
  isIndigent?: boolean;
  hasSenior?: boolean;
  hasPWD?: boolean;
  hasSoloParent?: boolean;
}

export interface UpdateWelfareFlagsInput {
  is4Ps?: boolean;
  isIndigent?: boolean;
  hasSenior?: boolean;
  hasPWD?: boolean;
  hasSoloParent?: boolean;
}

function householdDb() {
  return (prisma as any).household;
}

/** Formats user database object to member DTO */
function toMemberDTO(user: any): HouseholdMemberDTO {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || user.email;
  return {
    id: user.id,
    name,
    email: user.email,
    relationshipToHead: (user.relationshipToHead as HouseholdRole) ?? null,
    mobileNumber: user.mobileNumber ?? null,
    isSenior: Boolean(user.isSenior),
    isPWD: Boolean(user.isPWD),
    isSoloParent: Boolean(user.isSoloParent),
    is4PsBeneficiary: Boolean(user.is4PsBeneficiary),
  };
}

/** Formats household record into clean serializable DTO */
function toHouseholdDTO(row: any): HouseholdDTO {
  const head = row.head;
  const headName = head
    ? [head.firstName, head.lastName].filter(Boolean).join(" ") || head.name || head.email
    : null;

  const membersList: HouseholdMemberDTO[] = Array.isArray(row.members)
    ? row.members.map(toMemberDTO)
    : [];

  return {
    id: row.id,
    householdNumber: row.householdNumber,
    purok: row.purok as Purok,
    streetAddress: row.streetAddress,
    headId: row.headId ?? null,
    headName,
    headEmail: head?.email ?? null,
    members: membersList,
    memberCount: membersList.length,
    is4Ps: Boolean(row.is4Ps),
    isIndigent: Boolean(row.isIndigent),
    hasSenior: Boolean(row.hasSenior),
    hasPWD: Boolean(row.hasPWD),
    hasSoloParent: Boolean(row.hasSoloParent),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt).toISOString(),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : new Date(row.updatedAt).toISOString(),
  };
}

/**
 * Fetch households list with Purok, search query, or welfare indicator filters.
 */
export async function getHouseholds(options?: {
  purok?: string;
  search?: string;
  welfareFilter?: string;
}): Promise<HouseholdDTO[]> {
  try {
    const db = householdDb();
    if (!db) return [];

    const where: any = {};

    if (options?.purok && options.purok !== "ALL") {
      where.purok = options.purok;
    }

    if (options?.welfareFilter && options.welfareFilter !== "ALL") {
      if (options.welfareFilter === "4PS") where.is4Ps = true;
      if (options.welfareFilter === "INDIGENT") where.isIndigent = true;
      if (options.welfareFilter === "SENIOR") where.hasSenior = true;
      if (options.welfareFilter === "PWD") where.hasPWD = true;
      if (options.welfareFilter === "SOLO_PARENT") where.hasSoloParent = true;
    }

    if (options?.search && options.search.trim()) {
      const q = options.search.trim();
      where.OR = [
        { householdNumber: { contains: q, mode: "insensitive" } },
        { streetAddress: { contains: q, mode: "insensitive" } },
        { head: { name: { contains: q, mode: "insensitive" } } },
        { head: { firstName: { contains: q, mode: "insensitive" } } },
        { head: { lastName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const rows = await db.findMany({
      where,
      orderBy: [{ purok: "asc" }, { householdNumber: "asc" }],
      include: {
        head: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
        members: { select: { id: true, name: true, firstName: true, lastName: true, email: true, mobileNumber: true, relationshipToHead: true, isSenior: true, isPWD: true, isSoloParent: true, is4PsBeneficiary: true } },
      },
    });

    return rows.map(toHouseholdDTO);
  } catch (error) {
    console.error("Error fetching households:", error);
    return [];
  }
}

/**
 * Fetch a single household record by ID with members list.
 */
export async function getHouseholdById(id: string): Promise<HouseholdDTO | null> {
  try {
    const db = householdDb();
    if (!db) return null;

    const row = await db.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
        members: { select: { id: true, name: true, firstName: true, lastName: true, email: true, mobileNumber: true, relationshipToHead: true, isSenior: true, isPWD: true, isSoloParent: true, is4PsBeneficiary: true } },
      },
    });

    return row ? toHouseholdDTO(row) : null;
  } catch (error) {
    console.error(`Error fetching household ${id}:`, error);
    return null;
  }
}

/**
 * Generate census summary statistics across all households & residents.
 */
export async function getCensusStats(): Promise<CensusStatsDTO> {
  try {
    const db = householdDb();
    const households = db ? await db.findMany({
      select: {
        purok: true,
        is4Ps: true,
        isIndigent: true,
        hasSenior: true,
        hasPWD: true,
        hasSoloParent: true,
        _count: { select: { members: true } },
      },
    }) : [];

    // Also count individual tagged users from User model
    const [seniorsCount, pwdsCount, soloParentsCount] = await Promise.all([
      prisma.user.count({ where: { isSenior: true } as any }),
      prisma.user.count({ where: { isPWD: true } as any }),
      prisma.user.count({ where: { isSoloParent: true } as any }),
    ]);

    const stats: CensusStatsDTO = {
      totalHouseholds: households.length,
      totalPopulation: 0,
      total4PsHouseholds: 0,
      totalIndigentHouseholds: 0,
      totalSeniors: seniorsCount,
      totalPWDs: pwdsCount,
      totalSoloParents: soloParentsCount,
      purokBreakdown: {},
    };

    for (const h of households) {
      stats.totalPopulation += h._count?.members || 1;
      if (h.is4Ps) stats.total4PsHouseholds++;
      if (h.isIndigent) stats.totalIndigentHouseholds++;

      const pKey = String(h.purok);
      stats.purokBreakdown[pKey] = (stats.purokBreakdown[pKey] || 0) + 1;
    }

    return stats;
  } catch (error) {
    console.error("Error getting census stats:", error);
    return {
      totalHouseholds: 0,
      totalPopulation: 0,
      total4PsHouseholds: 0,
      totalIndigentHouseholds: 0,
      totalSeniors: 0,
      totalPWDs: 0,
      totalSoloParents: 0,
      purokBreakdown: {},
    };
  }
}

/**
 * Generates an official machine household number e.g. HH-P1-0042
 */
export async function generateHouseholdNumber(purok: Purok): Promise<string> {
  const purokNum = purok.replace("PUROK_", "P");
  try {
    const db = householdDb();
    if (!db) return `HH-${purokNum}-0001`;

    const count = await db.count({ where: { purok } });
    const seq = String(count + 1).padStart(4, "0");
    return `HH-${purokNum}-${seq}`;
  } catch (error) {
    return `HH-${purokNum}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
}

/**
 * Action / Function: Register a new Household.
 */
export async function createHousehold(input: CreateHouseholdInput) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const householdNumber = input.householdNumber || (await generateHouseholdNumber(input.purok));
  const db = householdDb();

  const created = await db.create({
    data: {
      householdNumber,
      purok: input.purok,
      streetAddress: input.streetAddress,
      headId: input.headId || null,
      is4Ps: Boolean(input.is4Ps),
      isIndigent: Boolean(input.isIndigent),
      hasSenior: Boolean(input.hasSenior),
      hasPWD: Boolean(input.hasPWD),
      hasSoloParent: Boolean(input.hasSoloParent),
    },
  });

  // If a headId is supplied, link user as head & member
  if (input.headId) {
    await prisma.user.update({
      where: { id: input.headId },
      data: {
        householdId: created.id,
        relationshipToHead: "HEAD" as any,
      } as any,
    });
  }

  revalidatePath(`/secretary/${session.user.id}/households`);
  return toHouseholdDTO(created);
}

/**
 * Action / Function: Update household welfare indicator flags.
 */
export async function updateHouseholdWelfare(
  householdId: string,
  flags: UpdateWelfareFlagsInput
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const db = householdDb();

  const updated = await db.update({
    where: { id: householdId },
    data: {
      ...(flags.is4Ps !== undefined ? { is4Ps: flags.is4Ps } : {}),
      ...(flags.isIndigent !== undefined ? { isIndigent: flags.isIndigent } : {}),
      ...(flags.hasSenior !== undefined ? { hasSenior: flags.hasSenior } : {}),
      ...(flags.hasPWD !== undefined ? { hasPWD: flags.hasPWD } : {}),
      ...(flags.hasSoloParent !== undefined ? { hasSoloParent: flags.hasSoloParent } : {}),
    },
  });

  revalidatePath(`/secretary/${session.user.id}/households`);
  revalidatePath(`/secretary/${session.user.id}/households/${householdId}`);

  return toHouseholdDTO(updated);
}

/**
 * Action / Function: Update individual resident member welfare flags.
 */
export async function updateMemberWelfareFlags(
  userId: string,
  flags: { isSenior?: boolean; isPWD?: boolean; isSoloParent?: boolean; is4PsBeneficiary?: boolean }
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(flags.isSenior !== undefined ? { isSenior: flags.isSenior } : {}),
      ...(flags.isPWD !== undefined ? { isPWD: flags.isPWD } : {}),
      ...(flags.isSoloParent !== undefined ? { isSoloParent: flags.isSoloParent } : {}),
      ...(flags.is4PsBeneficiary !== undefined ? { is4PsBeneficiary: flags.is4PsBeneficiary } : {}),
    } as any,
  });

  if ((updated as any).householdId) {
    revalidatePath(`/secretary/${session.user.id}/households/${(updated as any).householdId}`);
  }
  revalidatePath(`/secretary/${session.user.id}/households`);

  return toMemberDTO(updated);
}

/**
 * Action / Function: Add/link a resident user to a household with a role.
 */
export async function addHouseholdMember(
  householdId: string,
  userId: string,
  relationshipToHead: HouseholdRole
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: userId },
    data: {
      householdId,
      relationshipToHead: relationshipToHead as any,
    } as any,
  });

  if (relationshipToHead === "HEAD") {
    const db = householdDb();
    await db.update({
      where: { id: householdId },
      data: { headId: userId },
    });
  }

  revalidatePath(`/secretary/${session.user.id}/households/${householdId}`);
  revalidatePath(`/secretary/${session.user.id}/households`);
  return { ok: true };
}

/**
 * Action / Function: Remove a member from a household.
 */
export async function removeHouseholdMember(userId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const householdId = (user as any)?.householdId;

  await prisma.user.update({
    where: { id: userId },
    data: {
      householdId: null,
      relationshipToHead: null,
    } as any,
  });

  if (householdId) {
    const db = householdDb();
    const hh = await db.findUnique({ where: { id: householdId } });
    if (hh?.headId === userId) {
      await db.update({
        where: { id: householdId },
        data: { headId: null },
      });
    }
    revalidatePath(`/secretary/${session.user.id}/households/${householdId}`);
  }

  revalidatePath(`/secretary/${session.user.id}/households`);
  return { ok: true };
}

/**
 * Helper to fetch registered residents available to be added as household members.
 */
export async function getAvailableResidents() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      householdId: true as any,
    },
    orderBy: { lastName: "asc" },
  });

  return users.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.name || u.email,
    email: u.email,
    householdId: (u as any).householdId ?? null,
  }));
}
