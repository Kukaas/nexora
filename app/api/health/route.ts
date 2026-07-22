/**
 * Public health check. Unauthenticated. Reports whether the process is up and
 * whether its dependencies (currently Postgres) are reachable by running a
 * trivial `SELECT 1`. Returns 200 when everything is up and 503 when any
 * dependency is down, so uptime monitors and orchestrators can gate on the
 * status code alone.
 *
 * The proxy (proxy.ts) doesn't match /api/*, so this route needs no auth
 * exception. `force-dynamic` keeps it from being statically cached so every
 * hit reflects the live process.
 */
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CheckResult = {
  status: "up" | "down";
  latencyMs?: number;
  error?: string;
};

async function checkDatabase(): Promise<CheckResult> {
  const startedAt = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "up", latencyMs: Math.round(performance.now() - startedAt) };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

export async function GET() {
  const database = await checkDatabase();

  const checks = { database };
  const healthy = Object.values(checks).every((c) => c.status === "up");

  return Response.json(
    {
      status: healthy ? "ok" : "degraded",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}

// Some monitors probe with HEAD; answer 200 with no body.
export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
