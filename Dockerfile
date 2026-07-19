# syntax=docker/dockerfile:1

# Nexora runs a custom Node/socket.io server (server.ts), so it can't go on a
# serverless platform — it ships as a long-running container. Production starts
# it with `bun run start` (= `tsx server.ts --prod`), which means tsx and the
# TypeScript source are needed at RUNTIME, not just at build. We therefore keep
# the full dependency set in the final image rather than pruning dev deps.

FROM oven/bun:1.3.13-slim AS base
WORKDIR /app
ENV NODE_ENV=production
# Prisma's engines (used by generate/migrate) need OpenSSL on Debian slim.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Dependencies ----------------------------------------------------------
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- Build -----------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client into app/generated/prisma (gitignored, so absent
# from the build context) before Next can typecheck/import it.
RUN bunx prisma generate
# A placeholder DATABASE_URL satisfies modules that read it at import time; no
# database queries run during `next build` (authenticated pages are dynamic).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN bun run build

# ---- Runtime ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
# `bun run start` boots the server through tsx, which hooks Node's module loader
# and therefore needs a real `node` binary — the bun-slim image has none. Copy
# Node 22 in from the official image (same Debian bookworm base) so tsx runs
# under Node, matching the environment the app was validated on.
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
# Bring in the source first, then overlay the built artifacts and generated
# client so they win over anything stale in the context.
COPY . .
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/app/generated ./app/generated
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
# The entrypoint runs generate → migrate deploy → seed:admin → seed:documents,
# then execs the CMD below. `start` = tsx server.ts --prod → boots Next (from
# .next) + the socket.io realtime layer.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["bun", "run", "start"]
