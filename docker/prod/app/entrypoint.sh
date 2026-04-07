#!/bin/sh
# =============================================================================
# ElyOS entrypoint — Infisical opcionális
# Ha INFISICAL_CLIENT_ID és INFISICAL_CLIENT_SECRET meg van adva,
# varlock-on keresztül indul (Infisical secrets betöltésével).
# Ha nincs, simán bun-nal indul (env változók a Docker env-ből jönnek).
# =============================================================================

if [ -n "$INFISICAL_CLIENT_ID" ] && [ -n "$INFISICAL_CLIENT_SECRET" ]; then
  echo "[Entrypoint] Infisical credentials found, starting with varlock..."
  exec ./node_modules/.bin/varlock run -- bun run apps/web/server.js
else
  echo "[Entrypoint] No Infisical credentials, starting with env variables only..."
  exec bun run apps/web/server.js
fi
