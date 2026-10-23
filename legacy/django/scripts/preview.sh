#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py collectstatic --noinput
if [[ -f .preview.pid ]] && kill -0 "$(cat .preview.pid)" 2>/dev/null; then
    kill -HUP "$(cat .preview.pid)"
else
    .venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --daemon --pid .preview.pid --error-logfile .preview.log --no-control-socket
fi
printf '%s\n' 'Prévia local: http://127.0.0.1:8000/ | Admin: http://127.0.0.1:8000/admin/'
