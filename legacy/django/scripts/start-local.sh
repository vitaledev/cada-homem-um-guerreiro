#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/python manage.py migrate
.venv/bin/python manage.py collectstatic --noinput
exec .venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000 --workers 2 --access-logfile - --no-control-socket
