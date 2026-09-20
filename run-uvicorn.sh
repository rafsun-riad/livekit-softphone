#!/usr/bin/env bash

set -Eeuo pipefail

echo "Starting Backend with Uvicorn ASGI server..."

# If already inside the backend directory, stay there.
# Otherwise, navigate into the backend directory.
if [[ "$(basename "$PWD")" != "backend" ]]; then
    if [[ -d "$PWD/backend" ]]; then
        cd "$PWD/backend"
    else
        echo "Error: backend directory not found."
        echo "Run this script from the project root or backend directory."
        exit 1
    fi
fi

# Start the Uvicorn ASGI server
uv run uvicorn config.asgi:application \
    --port 8000 \
    --reload \
    --log-level debug
# Tip: to listen on all interfaces, add: --host 0.0.0.0
# Note: --reload is for development only; don't use in production
# Note: --log-level debug is very verbose; use info or warning in production
# Note: --host 0.0.0.0 exposes the server to all network interfaces


#for production setup gunicorn then use below script
# #!/usr/bin/env bash
# set -Eeuo pipefail

# WORKERS="${WORKERS:-4}"  # e.g., set to number of CPU cores
# echo "Starting Backend with Gunicorn ($WORKERS Uvicorn workers)..."

# uv run gunicorn backend.asgi:application \
#   --bind 0.0.0.0:8000 \
#   --workers "$WORKERS" \
#   --worker-class uvicorn.workers.UvicornWorker \
#   --log-level debug \
#   --graceful-timeout 30 \
#   --timeout 60 \
#   --max-requests 1000 \
#   --max-requests-jitter 50 \
#   --access-logfile -
