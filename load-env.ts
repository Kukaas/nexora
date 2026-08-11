/**
 * Load .env the way Next.js does, BEFORE anything else in the custom server is
 * imported. `next dev`/`next start` load these files automatically, but a custom
 * server started with tsx does not, so lib/prisma (which reads DATABASE_URL at
 * import time) would otherwise get an undefined connection string. This module
 * must be the very first import in server.ts.
 */
import { loadEnvConfig } from "@next/env";

const dev = !process.argv.includes("--prod") && process.env.NODE_ENV !== "production";
loadEnvConfig(process.cwd(), dev);

if (dev) {
  const port = process.env.PORT || "3001";
  process.env.BETTER_AUTH_URL = `http://localhost:${port}`;
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL = `http://localhost:${port}`;
}
    