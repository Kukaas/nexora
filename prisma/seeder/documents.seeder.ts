/**
 * Documents & announcements seeder.
 *
 * Seeds the secretary console and the resident portal with realistic sample
 * data: a catalog of requestable documents (each with a fee), a spread of
 * document requests across PENDING / PROCESSING / READY / REJECTED so the review
 * queue, filters, and detail sheet all have something to show, and a set of
 * published announcements for the resident feed.
 *
 * Run with:  bun run prisma/seeder/documents.seeder.ts
 *
 * Idempotent: skips the requests/announcements when they already exist, and
 * upserts the catalog by name, so it won't duplicate rows on a re-run.
 */
import { readFileSync } from "node:fs";

import { prisma } from "@/lib/prisma";
import {
  AnnouncementCategory,
  DocumentRequestStatus,
  PaymentMethodType,
} from "@/app/generated/prisma/enums";

const proof = (seed: string) => `https://picsum.photos/seed/${seed}/600/900`;

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

const RESIDENTS = [
  { email: "maria.santos@example.com", firstName: "Maria", lastName: "Santos" },
  { email: "jose.delacruz@example.com", firstName: "Jose", lastName: "Dela Cruz" },
  { email: "andres.bonifacio@example.com", firstName: "Andres", lastName: "Bonifacio" },
  { email: "gabriela.silang@example.com", firstName: "Gabriela", lastName: "Silang" },
  { email: "apolinario.mabini@example.com", firstName: "Apolinario", lastName: "Mabini" },
];

// `date` is the day the event/advisory takes effect (stored at UTC midnight,
// read back in Asia/Manila). Ongoing notices leave it null.
const eventDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

const ANNOUNCEMENTS = [
  {
    title: "Scheduled water interruption",
    category: AnnouncementCategory.ADVISORY,
    pinned: true,
    place: "Sitio Maligaya, Riverside",
    latitude: 13.348943,
    longitude: 121.829869,
    date: eventDate("2026-06-28"),
    startTime: "22:00",
    endTime: null,
    imageUrl: null,
    body: "Maynilad will shut off supply for line maintenance from 10:00 PM Saturday to 4:00 AM Sunday. Affected: Sitio Maligaya, Riverside, and the area around the covered court. Store enough water for the night and early morning. Service resumes gradually, so low pressure right after 4:00 AM is normal.",
  },
  {
    title: "Barangay general assembly",
    category: AnnouncementCategory.GOVERNANCE,
    pinned: false,
    place: "Libtangin Covered Court",
    latitude: 13.347275,
    longitude: 121.830356,
    date: eventDate("2026-07-05"),
    startTime: "08:00",
    endTime: null,
    imageUrl: null,
    body: "Quarterly assembly at the covered court, 8:00 AM. The budget update and the new waste plan will be presented. One representative per household is enough to be counted present. Bring questions for the open forum after the budget report.",
  },
  {
    title: "Free anti-rabies vaccination for pets",
    category: AnnouncementCategory.HEALTH,
    pinned: false,
    place: "Libtangin Health Center",
    latitude: 13.349245,
    longitude: 121.832562,
    date: eventDate("2026-07-02"),
    startTime: "08:00",
    endTime: "12:00",
    imageUrl: "https://picsum.photos/seed/nexora-vaccination/1200/675",
    body: "Bring cats and dogs to the health center on July 2, 8:00 AM to 12:00 NN. No fee, first come first served. Pets should be leashed or in a carrier. Supplies are limited to 200 doses for the day.",
  },
  {
    title: "Senior citizen pension payout",
    category: AnnouncementCategory.ASSISTANCE,
    pinned: false,
    place: "Barangay Hall, second floor",
    latitude: 13.347233,
    longitude: 121.830501,
    date: eventDate("2026-06-30"),
    startTime: "09:00",
    endTime: "15:00",
    imageUrl: null,
    body: "Social pension for the second quarter will be released June 30 to July 1 at the barangay hall. Bring a valid ID and your OSCA booklet. Beneficiaries who cannot come in person may send an authorized representative with a signed authorization letter and both IDs.",
  },
  {
    title: "New garbage collection days",
    category: AnnouncementCategory.ADVISORY,
    pinned: false,
    place: null,
    latitude: null,
    longitude: null,
    date: null,
    startTime: null,
    endTime: null,
    imageUrl: null,
    body: "Starting this week, biodegradable waste is collected Mondays and Thursdays; recyclables on Saturdays. Please segregate at source. Collection starts at 6:00 AM, so set out bins the night before.",
  },
  {
    title: "Barangay fiesta and fun run",
    category: AnnouncementCategory.EVENTS,
    pinned: false,
    place: "Libtangin Covered Court",
    latitude: 13.347275,
    longitude: 121.830356,
    date: eventDate("2026-07-12"),
    startTime: "05:30",
    endTime: null,
    imageUrl: "https://picsum.photos/seed/nexora-fiesta/1200/675",
    body: "Registration is open for the 5K fun run and the inter-sitio basketball league. Fun run gun start is 5:30 AM at the plaza; registration is free with a claimable shirt for the first 300 runners. Team rosters are due July 8.",
  },
];

async function seed() {
  // 1. Catalog — upsert by name so re-runs keep one row per document. The
  // Barangay Clearance also carries the designed template + its fields, applied
  // on create and on re-seed so the layout is always restored.
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
  const typeByName = new Map(types.map((t) => [t.name, t]));
  console.log(`✓ Catalog ready (${types.length} document types).`);

  // 2. Make sure the payment channels residents pay through exist.
  await prisma.paymentMethod.upsert({
    where: { type: PaymentMethodType.GCASH },
    update: {},
    create: {
      type: PaymentMethodType.GCASH,
      enabled: true,
      accountName: "Barangay Libtangin Treasury",
      accountNumber: "0917 555 0142",
      qrImage: proof("gcash-qr"),
    },
  });
  await prisma.paymentMethod.upsert({
    where: { type: PaymentMethodType.CASH },
    update: {},
    create: {
      type: PaymentMethodType.CASH,
      enabled: true,
      instructions:
        "Pay at the barangay hall, window 2. Open Monday to Friday, 8:00 AM to 5:00 PM.",
    },
  });

  // 3. Sample residents (idempotent by email).
  const residents = await Promise.all(
    RESIDENTS.map((r) =>
      prisma.user.upsert({
        where: { email: r.email },
        update: {},
        create: {
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          name: `${r.firstName} ${r.lastName}`,
          emailVerified: true,
          roles: { set: ["RESIDENT"] },
        },
        select: { id: true, firstName: true, lastName: true },
      }),
    ),
  );
  const fullName = (r: (typeof residents)[number]) =>
    `${r.firstName} ${r.lastName}`;
  const [maria, jose, andres, gabriela, apolinario] = residents;

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000);
  const ref = (n: string) => `BRGY-2026-${n}`;

  // 4. Document requests across the lifecycle.
  const existing = await prisma.documentRequest.count();
  if (existing > 0) {
    console.log(`✓ Document requests already seeded (${existing} rows). Skipping.`);
  } else {
    const t = (name: string) => typeByName.get(name)!;
    await prisma.documentRequest.createMany({
      data: [
        {
          referenceNumber: ref("04217"),
          documentTypeId: t("Barangay Clearance").id,
          documentName: "Barangay Clearance",
          fee: "50.00",
          purpose: "for employment",
          method: PaymentMethodType.GCASH,
          paymentReference: "0123 4567 8901",
          proofImage: proof("doc-maria"),
          status: DocumentRequestStatus.PENDING,
          requesterId: maria.id,
          requesterName: fullName(maria),
          createdAt: daysAgo(0),
        },
        {
          referenceNumber: ref("04219"),
          documentTypeId: t("Certificate of Indigency").id,
          documentName: "Certificate of Indigency",
          fee: "0.00",
          purpose: "for a medical assistance application",
          method: PaymentMethodType.CASH,
          status: DocumentRequestStatus.PENDING,
          requesterId: apolinario.id,
          requesterName: fullName(apolinario),
          createdAt: daysAgo(1),
        },
        {
          referenceNumber: ref("04203"),
          documentTypeId: t("Business Permit").id,
          documentName: "Business Permit",
          fee: "500.00",
          purpose: "sari-sari store renewal",
          method: PaymentMethodType.GCASH,
          paymentReference: "0998 221 7741",
          proofImage: proof("doc-jose"),
          status: DocumentRequestStatus.PROCESSING,
          requesterId: jose.id,
          requesterName: fullName(jose),
          reviewedAt: daysAgo(1),
          createdAt: daysAgo(2),
        },
        {
          referenceNumber: ref("04188"),
          documentTypeId: t("Certificate of Residency").id,
          documentName: "Certificate of Residency",
          fee: "30.00",
          method: PaymentMethodType.CASH,
          status: DocumentRequestStatus.READY,
          requesterId: gabriela.id,
          requesterName: fullName(gabriela),
          reviewedAt: daysAgo(3),
          releasedAt: daysAgo(2),
          createdAt: daysAgo(4),
        },
        {
          referenceNumber: ref("04176"),
          documentTypeId: t("Barangay ID").id,
          documentName: "Barangay ID",
          fee: "100.00",
          method: PaymentMethodType.GCASH,
          paymentReference: "0917 002 3398",
          proofImage: proof("doc-andres"),
          orNumber: "0041902",
          status: DocumentRequestStatus.CLAIMED,
          requesterId: andres.id,
          requesterName: fullName(andres),
          reviewedAt: daysAgo(5),
          releasedAt: daysAgo(4),
          createdAt: daysAgo(6),
        },
        {
          referenceNumber: ref("04150"),
          documentTypeId: t("Barangay Clearance").id,
          documentName: "Barangay Clearance",
          fee: "50.00",
          purpose: "for a job application",
          method: PaymentMethodType.GCASH,
          paymentReference: "0905 118 4420",
          proofImage: proof("doc-jose2"),
          status: DocumentRequestStatus.REJECTED,
          note: "The amount in the screenshot is ₱5.00, not ₱50.00. Please pay the full clearance fee and submit a new screenshot.",
          requesterId: jose.id,
          requesterName: fullName(jose),
          reviewedAt: daysAgo(6),
          createdAt: daysAgo(7),
        },
      ],
    });
    const count = await prisma.documentRequest.count();
    console.log(`✓ Seeded ${count} document requests.`);
  }

  // 5. Announcements.
  const existingAnn = await prisma.announcement.count();
  if (existingAnn > 0) {
    console.log(`✓ Announcements already seeded (${existingAnn} rows). Skipping.`);
  } else {
    await prisma.announcement.createMany({
      data: ANNOUNCEMENTS.map((a, i) => ({
        ...a,
        published: true,
        createdAt: daysAgo(i),
      })),
    });
    const count = await prisma.announcement.count();
    console.log(`✓ Seeded ${count} announcements.`);
  }
}

seed()
  .catch((error) => {
    console.error("Documents seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
