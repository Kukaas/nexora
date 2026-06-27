/**
 * Admin seeder.
 *
 * Creates (or updates) the single super-admin account: the one user with the
 * ADMIN role, which carries full access — including creating the official
 * accounts (captain, secretary, treasurer, kagawad). The admin signs in with
 * email + password like any resident, so we store the password on Better Auth's
 * "credential" account using Better Auth's own hasher, which means the seeded
 * password verifies at sign-in exactly like a normal sign-up.
 *
 * Run with:  bun run prisma/seeder/admin.seeder.ts
 *
 * Idempotent: re-running updates the existing admin's name, role and password
 * instead of creating duplicates. Override the defaults with ADMIN_EMAIL,
 * ADMIN_PASSWORD and ADMIN_NAME env vars.
 */
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@/lib/prisma";

// Better Auth lowercases stored emails, so normalize to match on re-runs.
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ?? "admin@libtangin.gov.ph"
).toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "ChangeMe!2026";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Barangay Administrator";

async function seedAdmin() {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  // Upsert the user with the ADMIN role and a pre-verified email so the admin
  // can sign in immediately, without the email-verification step.
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: ADMIN_NAME,
      emailVerified: true,
      roles: { set: ["ADMIN"] },
    },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      emailVerified: true,
      roles: { set: ["ADMIN"] },
    },
    select: { id: true },
  });

  // Better Auth keeps the password on an Account row with providerId
  // "credential" and accountId === user.id (see signUpEmail). Mirror that.
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

  return user.id;
}

seedAdmin()
  .then((id) => {
    console.log(`✓ Admin ready: ${ADMIN_EMAIL} (user ${id})`);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        `⚠ Seeded with the default password "${ADMIN_PASSWORD}". ` +
          `Set ADMIN_PASSWORD and re-run, or change it after first sign-in.`,
      );
    }
  })
  .catch((error) => {
    console.error("Admin seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
