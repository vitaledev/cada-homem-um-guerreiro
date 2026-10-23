#!/usr/bin/env bash
# Prefere o Node instalado no host; usa o runtime disponível nesta estação se necessário.
if ! command -v node >/dev/null 2>&1; then
  export PATH="/home/dev01/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/home/dev01/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
fi
