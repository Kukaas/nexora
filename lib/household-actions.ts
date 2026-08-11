"use server";

import {
  createHousehold as createHouseholdData,
  updateHouseholdWelfare as updateHouseholdWelfareData,
  updateMemberWelfareFlags as updateMemberWelfareFlagsData,
  addHouseholdMember as addHouseholdMemberData,
  removeHouseholdMember as removeHouseholdMemberData,
  type CreateHouseholdInput,
  type HouseholdRole,
} from "./household-data";

export async function createHousehold(input: CreateHouseholdInput) {
  return createHouseholdData(input);
}

export async function updateHouseholdWelfare(householdId: string, flags: {
  is4Ps?: boolean;
  isIndigent?: boolean;
  hasSenior?: boolean;
  hasPWD?: boolean;
  hasSoloParent?: boolean;
}) {
  return updateHouseholdWelfareData(householdId, flags);
}

export async function updateMemberWelfareFlags(userId: string, flags: {
  isSenior?: boolean;
  isPWD?: boolean;
  isSoloParent?: boolean;
  is4PsBeneficiary?: boolean;
  relationshipToHead?: HouseholdRole;
}) {
  return updateMemberWelfareFlagsData(userId, flags);
}

export async function addHouseholdMember(householdId: string, userId: string, relationshipToHead: HouseholdRole = "CHILD") {
  return addHouseholdMemberData(householdId, userId, relationshipToHead);
}

export async function removeHouseholdMember(userId: string) {
  return removeHouseholdMemberData(userId);
}
