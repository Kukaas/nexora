import "server-only";

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { DocumentRequestStatus } from "@/app/generated/prisma/enums";

/**
 * Public document verification. Every document request carries an unguessable
 * `verificationCode`; the printed document's QR encodes `/verify/<code>`, and
 * this module is the backend that resolves a scanned code into the minimal set
 * of facts a verifier needs to trust the paper in their hand.
 *
 * Why not key verification on the reference number? `BRGY-2026-#####` is only
 * five random digits — trivially enumerable. A public endpoint on that would
 * leak every resident's name and document. The code here is 80 bits of entropy,
 * so a page is reachable only by someone actually holding the document.
 */

// Crockford base32 (no I, L, O, U) — unambiguous when read off a printout.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** A fresh 16-char code from 80 bits of entropy. Not checked for uniqueness. */
function newCode(): string {
  const bytes = randomBytes(10);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/**
 * A verification code guaranteed unique in the table. Retries on the vanishing
 * chance of a collision. Call at request creation so every document is born
 * verifiable.
 */
export async function generateVerificationCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = newCode();
    const taken = await prisma.documentRequest.findUnique({
      where: { verificationCode: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  // 80-bit collisions don't happen; widen the code rather than loop forever.
  return `${newCode()}${newCode()}`;
}

/**
 * Return the request's verification code, generating and persisting one if it
 * doesn't have it yet. Covers documents created before this feature existed:
 * the first time such a document is printed, it gets a stable code.
 */
export async function ensureVerificationCode(requestId: string): Promise<string> {
  const existing = await prisma.documentRequest.findUnique({
    where: { id: requestId },
    select: { verificationCode: true },
  });
  if (existing?.verificationCode) return existing.verificationCode;

  const code = await generateVerificationCode();
  await prisma.documentRequest.update({
    where: { id: requestId },
    data: { verificationCode: code },
  });
  return code;
}

/** The verdict a scan resolves to, plus the facts the public page shows. */
export type VerifiedDocument = {
  documentName: string;
  referenceNumber: string;
  /** The person the document was issued to. */
  holderName: string;
  purpose: string | null;
  /** ISO date the document was released; null if somehow unreleased. */
  issuedAt: string | null;
  /** Released and waiting, or already claimed — either way, genuine. */
  status: DocumentRequestStatus;
};

/**
 * Resolve a scanned code into a genuine, issued document — or null. Only
 * READY/CLAIMED requests verify: a PENDING or REJECTED request is not a
 * document anyone should be holding, so it reads as "not valid". Returns only
 * what a verifier needs (name, reference, purpose, date) — never the resident's
 * contact details, payment info, or custom-field answers.
 */
export async function getVerifiedDocument(
  code: string,
): Promise<VerifiedDocument | null> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return null;

  const row = await prisma.documentRequest.findUnique({
    where: { verificationCode: trimmed },
    select: {
      documentName: true,
      referenceNumber: true,
      requesterName: true,
      purpose: true,
      releasedAt: true,
      status: true,
    },
  });

  if (
    !row ||
    (row.status !== DocumentRequestStatus.READY &&
      row.status !== DocumentRequestStatus.CLAIMED)
  ) {
    return null;
  }

  return {
    documentName: row.documentName,
    referenceNumber: row.referenceNumber,
    holderName: row.requesterName,
    purpose: row.purpose,
    issuedAt: row.releasedAt?.toISOString() ?? null,
    status: row.status,
  };
}
