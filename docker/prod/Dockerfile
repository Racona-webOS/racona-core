# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy workspace configuration and dummy env file
COPY package.json bun.lock ./
COPY .env.example ./.env

# Copy all workspace member package.json files (needed for frozen lockfile)
COPY apps/web/package.json ./apps/web/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/webos-sdk-types/package.json ./packages/webos-sdk-types/package.json
COPY examples/plugins/sdk-demo/package.json ./examples/plugins/sdk-demo/package.json

# Install all dependencies (respects workspace structure)
RUN bun install --frozen-lockfile

# Copy rest of the source code (node_modules excluded by .dockerignore)
COPY apps/web ./apps/web

# Copy workspace packages (needed for workspace dependencies)
COPY packages/database ./packages/database

# Build the application
RUN bun run app:build

# Production stage
FROM oven/bun:1.3.10-alpine AS production

WORKDIR /app

# Install su-exec for dropping privileges and create non-root user
RUN apk add --no-cache su-exec && \
    addgroup -g 1001 -S nodejs && \
    adduser -S elyos -u 1001 && \
    mkdir -p /app/uploads && \
    chown elyos:nodejs /app/uploads

# Copy workspace configuration + lockfile for reproducible installs
COPY --from=builder --chown=elyos:nodejs /app/package.json ./
COPY --from=builder --chown=elyos:nodejs /app/bun.lock ./

# Copy workspace packages
COPY --from=builder --chown=elyos:nodejs /app/packages/database/drizzle ./packages/database/drizzle
COPY --from=builder --chown=elyos:nodejs /app/packages/database/src ./packages/database/src
COPY --from=builder --chown=elyos:nodejs /app/packages/database/drizzle.config.ts ./packages/database/drizzle.config.ts
COPY --from=builder --chown=elyos:nodejs /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder --chown=elyos:nodejs /app/packages/database/tsconfig.json ./packages/database/tsconfig.json

# Copy built application
COPY --from=builder --chown=elyos:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=elyos:nodejs /app/apps/web/build ./apps/web/build
COPY --from=builder --chown=elyos:nodejs /app/apps/web/server.js ./apps/web/server.js

# Copy entrypoint script
COPY --chmod=755 docker/prod/entrypoint.sh /entrypoint.sh

# Copy demo reset cron script
COPY --chmod=755 docker/prod/demo-reset-cron.sh /app/demo-reset-cron.sh

# Copy hiányzó workspace package.json-ok a workspace feloldáshoz
COPY --from=builder --chown=elyos:nodejs /app/packages/webos-sdk-types/package.json ./packages/webos-sdk-types/package.json
COPY --from=builder --chown=elyos:nodejs /app/examples/plugins/hello-world/package.json ./examples/plugins/hello-world/package.json

# Csak production függőségek telepítése
RUN bun install --production

# Don't switch to non-root user here - entrypoint handles it
# USER elyos

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Use entrypoint to fix permissions then drop to elyos user
ENTRYPOINT ["/entrypoint.sh"]
CMD ["bun", "run", "apps/web/server.js"]
