/**
 * Client-safe purok vocabulary shared across the resident, admin, secretary,
 * and kagawad screens. Barangay Libtangin is divided into seven puroks; a
 * resident belongs to one, a kagawad is assigned one, and an announcement can
 * target one (or none, meaning barangay-wide).
 */

import { Purok } from "@/app/generated/prisma/enums";

/** Display order for pickers and lists: Purok 1 through Purok 7. */
export const PUROK_ORDER = [
  Purok.PUROK_1,
  Purok.PUROK_2,
  Purok.PUROK_3,
  Purok.PUROK_4,
  Purok.PUROK_5,
  Purok.PUROK_6,
  Purok.PUROK_7,
] as const;

export const PUROK_LABELS: Record<Purok, string> = {
  [Purok.PUROK_1]: "Purok 1",
  [Purok.PUROK_2]: "Purok 2",
  [Purok.PUROK_3]: "Purok 3",
  [Purok.PUROK_4]: "Purok 4",
  [Purok.PUROK_5]: "Purok 5",
  [Purok.PUROK_6]: "Purok 6",
  [Purok.PUROK_7]: "Purok 7",
};

/** Label for an optional purok, e.g. an announcement's audience. */
export function purokLabel(purok: Purok | null | undefined): string {
  return purok ? PUROK_LABELS[purok] : "Barangay-wide";
}
