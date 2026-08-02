import {
  BadgeCheck,
  Building2,
  ClipboardList,
  FileText,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * The barangay's standard service catalogue, shared by the homepage summary and
 * the /services page. Document *types* are configured in the database by the
 * secretary, so this list is two things at once: the copy the homepage shows,
 * and the fallback /services renders before any type has been set up.
 */
export type CatalogEntry = {
  icon: LucideIcon;
  name: string;
  body: string;
  /** What a resident should have ready before filing this one. */
  needs?: string;
};

export const SERVICE_CATALOG: CatalogEntry[] = [
  {
    icon: ShieldCheck,
    name: "Barangay Clearance",
    body: "For employment, business, or proof of good standing.",
    needs: "Your purpose for the clearance, and a verified profile.",
  },
  {
    icon: FileText,
    name: "Certificate of Residency",
    body: "Official proof that you live in Barangay Libtangin.",
    needs: "Your complete address, including purok.",
  },
  {
    icon: BadgeCheck,
    name: "Certificate of Indigency",
    body: "For scholarships, medical assistance, and legal aid.",
    needs: "The office or program the certificate is for.",
  },
  {
    icon: Building2,
    name: "Business Permit",
    body: "Register or renew a barangay business permit.",
    needs: "Your business name, nature of business, and its address.",
  },
  {
    icon: Scale,
    name: "Complaints and Blotter",
    body: "File a report and follow it through to resolution.",
    needs: "The date, place, and account of what happened.",
  },
  {
    icon: ClipboardList,
    name: "Assistance Requests",
    body: "Ask the barangay for help and track the response.",
    needs: "A short description of the help you need.",
  },
];

/**
 * Pick an icon for a document type configured in the database. Types are free
 * text, so match loosely on the catalogue's names and fall back to a plain
 * document mark rather than leaving the row without one.
 */
export function iconForDocumentType(name: string): LucideIcon {
  const needle = name.toLowerCase();
  const hit = SERVICE_CATALOG.find((entry) => {
    const label = entry.name.toLowerCase();
    return needle.includes(label) || label.includes(needle);
  });
  if (hit) return hit.icon;
  if (needle.includes("permit") || needle.includes("business")) return Building2;
  if (needle.includes("indigen")) return BadgeCheck;
  if (needle.includes("clearance")) return ShieldCheck;
  return FileText;
}
