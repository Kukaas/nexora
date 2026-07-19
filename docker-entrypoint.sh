#!/bin/sh
# Startup sequence for the Nexora container: regenerate the Prisma client, apply
# any pending migrations, seed the admin + document catalog, then hand off to the
# server (CMD). Migrations and seeders are idempotent, so this is safe on every
# start. Set RUN_SEED=false to skip seeding (migrations still run).
set -e

echo "▶ Generating Prisma client…"
bunx prisma generate

echo "▶ Applying migrations (prisma migrate deploy)…"
bunx prisma migrate deploy

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "▶ Seeding admin…"
  bun run seed:admin
  echo "▶ Seeding documents…"
  bun run seed:documents
else
  echo "▶ RUN_SEED=false → skipping seeders."
fi

echo "▶ Starting Nexora…"
exec "$@"
