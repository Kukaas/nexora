/**
 * Documents seeder.
 *
 * Seeds the secretary console and the resident portal with the catalog of
 * requestable documents (each with a fee), including the designed Barangay
 * Clearance layout and its fields.
 *
 * Run with:  bun run prisma/seeder/documents.seeder.ts
 *
 * Idempotent: upserts the catalog by name, so it won't duplicate rows on a
 * re-run.
 */
import { readFileSync } from "node:fs";

import { prisma } from "@/lib/prisma";

/**
 * The designed Barangay Clearance layout, captured from the document editor.
 * The HTML is the absolute-positioned template (letterhead images, boxes, and
 * field placeholders bound by the exact field ids below); the images are
 * Cloudinary URLs, so the layout renders the same wherever this is seeded.
 * Keeping the field ids identical is what lets the template's placeholders bind
 * to the right values.
 */
const CLEARANCE_TEMPLATE = readFileSync(
  new URL("./data/barangay-clearance.html", import.meta.url),
  "utf8",
);

const CLEARANCE_FIELDS = [
  { id: "clr-name", label: "Full name", type: "text", required: true, options: [] },
  { id: "clr-birth", label: "Birth date", type: "date", required: true, options: [] },
  {
    id: "clr-civil",
    label: "Civil status",
    type: "select",
    required: true,
    options: ["Single", "Married", "Widowed", "Separated"],
  },
  {
    id: "7b4fb0c9-63df-4e76-8b80-17c647de86a3",
    label: "Purok",
    type: "select",
    required: true,
    options: ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6", "Purok 7"],
  },
  {
    id: "41bbdbc6-0b22-4966-8104-419948e983c6",
    label: "Place of Birth",
    type: "text",
    required: true,
    options: [],
  },
];

const DOCUMENT_TYPES = [
  {
    name: "Barangay Clearance",
    description: "For employment, permits, and IDs.",
    fee: "50.00",
    turnaroundDays: 2,
  },
  {
    name: "Certificate of Residency",
    description: "Proof you live in the barangay.",
    fee: "30.00",
    turnaroundDays: 1,
    fields: [
      { id: "res-name", label: "Full name", type: "text", required: true, options: [] },
      {
        id: "res-years",
        label: "Years of residency",
        type: "number",
        required: true,
        options: [],
      },
    ],
  },
  {
    name: "Certificate of Indigency",
    description: "For scholarships, medical, and legal aid.",
    fee: "0.00",
    turnaroundDays: 2,
  },
  {
    name: "Business Permit",
    description: "Barangay endorsement to operate a business.",
    fee: "500.00",
    turnaroundDays: 3,
  },
  {
    name: "Barangay ID",
    description: "A valid local ID for residents.",
    fee: "100.00",
    turnaroundDays: 5,
  },
];

async function seed() {
  // Catalog — upsert by name so re-runs keep one row per document. The Barangay
  // Clearance also carries the designed template + its fields, applied on create
  // and on re-seed so the layout is always restored.
  const types = await Promise.all(
    DOCUMENT_TYPES.map((t) => {
      const layout =
        t.name === "Barangay Clearance"
          ? {
              template: CLEARANCE_TEMPLATE,
              fields: CLEARANCE_FIELDS,
              paperSize: "Letter",
              orientation: "portrait",
            }
          : {};
      return prisma.documentType.upsert({
        where: { name: t.name },
        update: layout,
        create: { ...t, ...layout },
        select: { id: true, name: true, fee: true },
      });
    }),
  );
  console.log(`✓ Catalog ready (${types.length} document types).`);
}

seed()
  .catch((error) => {
    console.error("Documents seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
