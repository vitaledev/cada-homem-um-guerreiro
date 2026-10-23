#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
mkdir -p backups
stamp=$(date -u +%Y%m%dT%H%M%SZ)
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/postgres-$stamp.dump"
docker compose exec -T api tar -C /app/media -czf - . > "backups/media-$stamp.tar.gz"
printf '%s\n' 'Backup gerado. Cifre e copie para armazenamento fora do host; teste a restauração.'
