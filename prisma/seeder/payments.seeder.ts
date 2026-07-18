/**
 * Payments seeder.
 *
 * Seeds the treasurer screens with realistic sample data: the three payment
 * channels (GCash + Maya configured, cash enabled) and a spread of payment
 * submissions across PENDING / VERIFIED / REJECTED so the review queue, filters,
 * and detail sheet all have something to show.
 *
 * Run with:  bun run prisma/seeder/payments.seeder.ts
 *
 * Idempotent: skips seeding when payments already exist, so it won't duplicate
 * rows or clobber real data on a re-run.
 */
import { prisma } from "@/lib/prisma";
import {
  PaymentMethodType,
  PaymentStatus,
} from "@/app/generated/prisma/enums";

// Stable, real placeholder images standing in for resident-uploaded receipts.
const proof = (seed: string) =>
  `https://picsum.photos/seed/${seed}/600/900`;

const RESIDENTS = [
  { email: "maria.santos@example.com", firstName: "Maria", lastName: "Santos" },
  { email: "jose.delacruz@example.com", firstName: "Jose", lastName: "Dela Cruz" },
  { email: "andres.bonifacio@example.com", firstName: "Andres", lastName: "Bonifacio" },
  { email: "gabriela.silang@example.com", firstName: "Gabriela", lastName: "Silang" },
  { email: "apolinario.mabini@example.com", firstName: "Apolinario", lastName: "Mabini" },
];

async function seedPayments() {
  const existing = await prisma.payment.count();
  if (existing > 0) {
    console.log(`✓ Payments already seeded (${existing} rows). Skipping.`);
    return;
  }

  // Ensure sample residents exist (idempotent by email).
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

  // Payment channels.
  await prisma.paymentMethod.upsert({
    where: { type: PaymentMethodType.GCASH },
    update: {},
    create: {
      type: PaymentMethodType.GCASH,
      enabled: true,
      accountName: "Barangay Libtangin Treasury",
      accountNumber: "0917 555 0142",
      qrImage: proof("gcash-qr"),
      instructions: null,
    },
  });
  await prisma.paymentMethod.upsert({
    where: { type: PaymentMethodType.MAYA },
    update: {},
    create: {
      type: PaymentMethodType.MAYA,
      enabled: false,
      accountName: "Barangay Libtangin Treasury",
      accountNumber: "0918 222 7788",
      qrImage: null,
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

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000);

  const [maria, jose, andres, gabriela, apolinario] = residents;

  await prisma.payment.createMany({
    data: [
      // Pending
      {
        payerId: maria.id,
        payerName: fullName(maria),
        purpose: "Barangay Clearance",
        amount: "50.00",
        method: PaymentMethodType.GCASH,
        referenceNumber: "GC-2026-018342",
        proofImage: proof("pay-maria"),
        status: PaymentStatus.PENDING,
        createdAt: daysAgo(0),
      },
      {
        payerId: jose.id,
        payerName: fullName(jose),
        purpose: "Business Permit (sari-sari store)",
        amount: "500.00",
        method: PaymentMethodType.MAYA,
        referenceNumber: "MY-7781-22090",
        proofImage: proof("pay-jose"),
        status: PaymentStatus.PENDING,
        createdAt: daysAgo(1),
      },
      {
        payerId: gabriela.id,
        payerName: fullName(gabriela),
        purpose: "Certificate of Residency",
        amount: "30.00",
        method: PaymentMethodType.CASH,
        status: PaymentStatus.PENDING,
        createdAt: daysAgo(1),
      },
      {
        payerId: apolinario.id,
        payerName: fullName(apolinario),
        purpose: "Certificate of Indigency",
        amount: "25.00",
        method: PaymentMethodType.GCASH,
        referenceNumber: "GC-2026-018501",
        proofImage: proof("pay-apol"),
        status: PaymentStatus.PENDING,
        createdAt: daysAgo(2),
      },
      // Verified (this month)
      {
        payerId: andres.id,
        payerName: fullName(andres),
        purpose: "Barangay ID",
        amount: "100.00",
        method: PaymentMethodType.GCASH,
        referenceNumber: "GC-2026-017903",
        proofImage: proof("pay-andres"),
        status: PaymentStatus.VERIFIED,
        reviewedAt: daysAgo(3),
        createdAt: daysAgo(4),
      },
      {
        payerId: maria.id,
        payerName: fullName(maria),
        purpose: "Business Permit (renewal)",
        amount: "500.00",
        method: PaymentMethodType.CASH,
        status: PaymentStatus.VERIFIED,
        reviewedAt: daysAgo(5),
        createdAt: daysAgo(6),
      },
      // Rejected
      {
        payerId: jose.id,
        payerName: fullName(jose),
        purpose: "Barangay Clearance",
        amount: "50.00",
        method: PaymentMethodType.GCASH,
        referenceNumber: "GC-2026-016655",
        proofImage: proof("pay-jose2"),
        status: PaymentStatus.REJECTED,
        reviewNote:
          "The amount in the screenshot is ₱5.00, not ₱50.00. Please pay the full clearance fee and submit a new screenshot.",
        reviewedAt: daysAgo(7),
        createdAt: daysAgo(8),
      },
    ],
  });

  const count = await prisma.payment.count();
  console.log(`✓ Seeded ${count} payments and 3 payment channels.`);
}

seedPayments()
  .catch((error) => {
    console.error("Payments seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
