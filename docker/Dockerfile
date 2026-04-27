# =============================================================================
# ElyOS Core — Optimalizált multi-stage Docker build
# =============================================================================
# Három fázis:
#   1. deps    — függőségek telepítése (cache-elhető réteg)
#   2. builder — alkalmazás build (SvelteKit + adapter-node)
#   3. runner  — production image (minimális méret)
# =============================================================================

# ---------------------------------------------------------------------------
# 1. Fázis: Függőségek telepítése
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps

WORKDIR /app

# Először csak a package.json és lockfile fájlokat másoljuk a cache optimalizáláshoz.
# Ha a függőségek nem változnak, ez a réteg cache-ből jön.
# Updated: 2026-04-27 - Fixed Bun 1.3.13 compatibility
COPY package.json bun.lock ./

# Workspace package.json fájlok — szükségesek a workspace feloldáshoz
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/cli/package.json ./packages/cli/
COPY examples/plugins/sdk-demo/package.json ./examples/plugins/sdk-demo/
COPY examples/plugins/todo-list/package.json ./examples/plugins/todo-list/
COPY examples/plugins/weather/package.json ./examples/plugins/weather/
COPY examples/plugins/map-example/package.json ./examples/plugins/map-example/
COPY examples/plugins/shared-libs-example/package.json ./examples/plugins/shared-libs-example/

# Függőségek telepítése frozen lockfile-lal a reprodukálhatóságért
RUN bun install --frozen-lockfile

# ---------------------------------------------------------------------------
# 2. Fázis: Alkalmazás build
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS builder

WORKDIR /app

# Függőségek másolása a deps fázisból
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

# Workspace konfiguráció
COPY package.json bun.lock ./

# Dummy .env fájl a build-hez (a SvelteKit build-nek szüksége van rá)
COPY .env.example ./.env

# Forráskód másolása
COPY apps/web ./apps/web
COPY packages/database ./packages/database
COPY packages/sdk ./packages/sdk
COPY packages/cli ./packages/cli
COPY examples/plugins/sdk-demo ./examples/plugins/sdk-demo
COPY examples/plugins/todo-list ./examples/plugins/todo-list
COPY examples/plugins/weather ./examples/plugins/weather

# SDK build (szükséges a SvelteKit build-hez)
RUN cd packages/sdk && bun run build

# SvelteKit alkalmazás build (adapter-node kimenet: apps/web/build/)
ENV NODE_ENV=production
RUN bun run app:build

# ---------------------------------------------------------------------------
# 3. Fázis: Production image (minimális méret)
# ---------------------------------------------------------------------------
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Nem-root felhasználó létrehozása a biztonságért
RUN addgroup -g 1001 -S nodejs && \
    adduser -S racona -u 1001 -G nodejs && \
    mkdir -p /app/uploads && \
    chown -R racona:nodejs /app/uploads

# Workspace konfiguráció (szükséges a production install-hoz)
COPY --from=builder --chown=racona:nodejs /app/package.json ./
COPY --from=builder --chown=racona:nodejs /app/bun.lock ./

# Workspace package.json fájlok a workspace feloldáshoz
COPY --from=builder --chown=racona:nodejs /app/apps/web/package.json ./apps/web/
COPY --from=builder --chown=racona:nodejs /app/packages/database/package.json ./packages/database/
COPY --from=builder --chown=racona:nodejs /app/packages/sdk/package.json ./packages/sdk/
COPY --from=builder --chown=racona:nodejs /app/packages/cli/package.json ./packages/cli/
COPY --from=builder --chown=racona:nodejs /app/examples/plugins/sdk-demo/package.json ./examples/plugins/sdk-demo/
COPY --from=builder --chown=racona:nodejs /app/examples/plugins/todo-list/package.json ./examples/plugins/todo-list/
COPY --from=builder --chown=racona:nodejs /app/examples/plugins/weather/package.json ./examples/plugins/weather/

# Build kimenet — SvelteKit adapter-node output
COPY --from=builder --chown=racona:nodejs /app/apps/web/build ./apps/web/build

# Express + Socket.IO szerver
COPY --from=builder --chown=racona:nodejs /app/apps/web/server.js ./apps/web/server.js

# Demo reset cron script
COPY --chmod=755 docker/prod/demo-reset-cron.sh /app/demo-reset-cron.sh

# Database package — migrációk és séma (szükséges runtime-ban a Drizzle-nek)
COPY --from=builder --chown=racona:nodejs /app/packages/database/drizzle ./packages/database/drizzle
COPY --from=builder --chown=racona:nodejs /app/packages/database/src ./packages/database/src
COPY --from=builder --chown=racona:nodejs /app/packages/database/drizzle.config.ts ./packages/database/drizzle.config.ts
COPY --from=builder --chown=racona:nodejs /app/packages/database/tsconfig.json ./packages/database/tsconfig.json

# Csak production függőségek telepítése (dev dependencies nélkül)
RUN bun install --production --frozen-lockfile

# Varlock az apps/web/node_modules/.bin-ben elérhető (apps/web workspace dependency)

# Környezeti változók
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Port megnyitása
EXPOSE 3000

# Health check — az /api/health végponton ellenőrzi az alkalmazás állapotát
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Nem-root felhasználóra váltás
USER racona

# Alkalmazás indítása Varlock-on keresztül (secrets betöltése indításkor, majd Express + Socket.IO szerver)
CMD ["./apps/web/node_modules/.bin/varlock", "run", "--", "bun", "run", "apps/web/server.js"]
