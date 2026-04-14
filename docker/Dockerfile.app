# =============================================================================
# ElyOS Core — App-only Docker image (adatbázis setup nélkül)
# =============================================================================
# Ez az image csak az alkalmazást tartalmazza.
# Az adatbázis migrációt és seed-et kézzel kell elvégezni.
# =============================================================================

# ---------------------------------------------------------------------------
# 1. Fázis: Függőségek telepítése
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS deps

WORKDIR /app

COPY package.json bun.lock ./

COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/cli/package.json ./packages/cli/
COPY examples/plugins/sdk-demo/package.json ./examples/plugins/sdk-demo/
COPY examples/plugins/todo-list/package.json ./examples/plugins/todo-list/
COPY examples/plugins/weather/package.json ./examples/plugins/weather/

RUN bun install --frozen-lockfile
RUN bun add -d typescript

# ---------------------------------------------------------------------------
# 2. Fázis: Build
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules

COPY package.json bun.lock ./
COPY .env.example ./.env

COPY apps/web ./apps/web
COPY packages/database ./packages/database
COPY packages/sdk ./packages/sdk
COPY packages/cli ./packages/cli

RUN cd packages/sdk && bun run build

ENV NODE_ENV=production
RUN bun run app:build

# ---------------------------------------------------------------------------
# 3. Fázis: Production image
# ---------------------------------------------------------------------------
FROM oven/bun:1-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S racona -u 1001 -G nodejs && \
    mkdir -p /app/uploads && \
    chown -R racona:nodejs /app/uploads

COPY --from=builder --chown=racona:nodejs /app/package.json ./
COPY --from=builder --chown=racona:nodejs /app/bun.lock ./

COPY --from=builder --chown=racona:nodejs /app/apps/web/package.json ./apps/web/
COPY --from=builder --chown=racona:nodejs /app/packages/database/package.json ./packages/database/
COPY --from=builder --chown=racona:nodejs /app/packages/sdk/package.json ./packages/sdk/
COPY --from=builder --chown=racona:nodejs /app/packages/cli/package.json ./packages/cli/
COPY --from=deps --chown=racona:nodejs /app/examples/plugins/sdk-demo/package.json ./examples/plugins/sdk-demo/
COPY --from=deps --chown=racona:nodejs /app/examples/plugins/todo-list/package.json ./examples/plugins/todo-list/
COPY --from=deps --chown=racona:nodejs /app/examples/plugins/weather/package.json ./examples/plugins/weather/

# SvelteKit build output + szerver
COPY --from=builder --chown=racona:nodejs /app/apps/web/build ./apps/web/build
COPY --from=builder --chown=racona:nodejs /app/apps/web/server.js ./apps/web/server.js

# Entrypoint script (Infisical opcionális)
COPY --chmod=755 docker/prod/app/entrypoint.sh /app/entrypoint.sh

# Csak production függőségek
RUN bun install --production --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

USER racona

CMD ["/app/entrypoint.sh"]
