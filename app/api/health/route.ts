/**
 * Public health/liveness probe. Unauthenticated and intentionally cheap: it
 * touches no database or external service, so it stays green as long as the
 * Node process is up and serving HTTP. That makes it safe to point uptime
 * monitors, load balancers, or Railway's healthcheck at without coupling
 * "is the process alive" to "is Postgres reachable".
 *
 * The proxy (proxy.ts) doesn't match /api/*, so this route needs no auth
 * exception. `force-dynamic` keeps it from being statically cached so every
 * hit reflects the live process.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
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
