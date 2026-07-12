import { IDType } from "@/app/generated/prisma/enums";

/**
 * The government IDs a resident may submit for verification, in display order.
 * Client-safe (no server imports) so setup, resubmit, and the profile ID editor
 * can all share one source of truth for labels and the select options.
 */
export const ID_TYPE_OPTIONS: { value: IDType; label: string }[] = [
  { value: IDType.DRIVER_LICENSE, label: "Driver's license" },
  { value: IDType.PASSPORT, label: "Passport" },
  { value: IDType.SSS, label: "SSS ID" },
  { value: IDType.GSIS, label: "GSIS ID" },
  { value: IDType.PRC, label: "PRC ID" },
  { value: IDType.OTHERS, label: "Other government ID" },
];

/** Display label for a stored ID type. */
export const ID_TYPE_LABELS: Record<IDType, string> = {
  [IDType.DRIVER_LICENSE]: "Driver's license",
  [IDType.PASSPORT]: "Passport",
  [IDType.SSS]: "SSS ID",
  [IDType.GSIS]: "GSIS ID",
  [IDType.PRC]: "PRC ID",
  [IDType.OTHERS]: "Other government ID",
};
