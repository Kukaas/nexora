/**
 * Officials seeder.
 *
 * Creates (or updates) the barangay official accounts — captain, secretary,
 * treasurer and the kagawads. In production these are created one-by-one by the
 * admin (see lib/admin-actions.ts), which forces a password change on first
 * sign-in. For local development we seed them ready to use: the email is
 * pre-verified and the shared temporary password verifies at sign-in exactly
 * like a normal sign-up, because we store it on Better Auth's "credential"
 * account using Better Auth's own hasher.
 *
 * Run with:  bun run prisma/seeder/officials.seeder.ts
 *
 * Idempotent: re-running updates each official's name, role and password
 * instead of creating duplicates. Override the shared password with the
 * OFFICIALS_PASSWORD env var.
 */
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";
import type { UserRoles } from "@/app/generated/prisma/enums";

const OFFICIALS_PASSWORD = process.env.OFFICIALS_PASSWORD ?? "ChangeMe!2026";

type OfficialSeed = {
  role: UserRoles;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
};

// Better Auth lowercases stored emails, so emails are written lowercased to
// match on re-runs.
const OFFICIALS: OfficialSeed[] = [
  {
    role: "CAPTAIN",
    firstName: "Ramon",
    middleName: "Dela",
    lastName: "Cruz",
    email: "captain@libtangin.gov.ph",
  },
  {
    role: "SECRETARY",
    firstName: "Maria",
    middleName: "Santos",
    lastName: "Reyes",
    email: "secretary@libtangin.gov.ph",
  },
  {
    role: "TREASURER",
    firstName: "Jose",
    middleName: "Garcia",
    lastName: "Mendoza",
    email: "treasurer@libtangin.gov.ph",
  },
  {
    role: "KAGAWAD",
    firstName: "Antonio",
    lastName: "Bautista",
    email: "kagawad1@libtangin.gov.ph",
  },
  {
    role: "KAGAWAD",
    firstName: "Teresa",
    middleName: "Lim",
    lastName: "Villanueva",
    email: "kagawad2@libtangin.gov.ph",
  },
];

async function seedOfficial(official: OfficialSeed, passwordHash: string) {
  const { role, firstName, lastName } = official;
  const middleName = official.middleName ?? null;
  const email = official.email.toLowerCase();
  const name = [firstName, middleName, lastName].filter(Boolean).join(" ");

  // Upsert the user with the official role and a pre-verified email so they can
  // sign in immediately, without the email-verification step.
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      firstName,
      middleName,
      lastName,
      emailVerified: true,
      roles: { set: [role] },
    },
    create: {
      email,
      name,
      firstName,
      middleName,
      lastName,
      emailVerified: true,
      roles: { set: [role] },
    },
    select: { id: true },
  });

  // Better Auth keeps the password on an Account row with providerId
  // "credential" and accountId === user.id (see signUpEmail / admin.seeder).
  const credential = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });

  if (credential) {
    await prisma.account.update({
      where: { id: credential.id },
      data: { password: passwordHash },
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: passwordHash,
      },
    });
  }

  return { email, role, id: user.id };
}

async function seedOfficials() {
  const passwordHash = await hashPassword(OFFICIALS_PASSWORD);

  const results = [];
  for (const official of OFFICIALS) {
    results.push(await seedOfficial(official, passwordHash));
  }
  return results;
}

seedOfficials()
  .then((officials) => {
    for (const { email, role, id } of officials) {
      console.log(`✓ ${role.padEnd(9)} ready: ${email} (user ${id})`);
    }
    if (!process.env.OFFICIALS_PASSWORD) {
      console.warn(
        `⚠ Seeded with the default password "${OFFICIALS_PASSWORD}". ` +
          `Set OFFICIALS_PASSWORD and re-run, or change it after first sign-in.`,
      );
    }
  })
  .catch((error) => {
    console.error("Officials seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
