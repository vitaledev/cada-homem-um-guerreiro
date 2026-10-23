#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/node-env.sh
if [[ ! -f apps/api/dist/main.js || ! -f apps/web/.next/standalone/apps/web/server.js ]]; then
  NEXT_TELEMETRY_DISABLED=1 pnpm build
fi
node scripts/preview-next.mjs
