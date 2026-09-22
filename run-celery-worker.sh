#!/bin/bash
#
# Celery Worker startup script
# Starts a Celery worker with logging to backend/media/logs
# Run from project root
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project root (directory where this script is located)
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_PATH="$BACKEND_DIR/.venv"
LOGS_DIR="$BACKEND_DIR/media/logs"

echo -e "${YELLOW}[Celery Worker] Starting...${NC}"

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}[Celery Worker] Error: Virtual environment not found at $VENV_PATH${NC}"
    exit 1
fi

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Set DJANGO_SETTINGS_MODULE
export DJANGO_SETTINGS_MODULE=config.settings.dev

echo -e "${GREEN}[Celery Worker] Using Python: $(which python)${NC}"
echo -e "${GREEN}[Celery Worker] Logs directory: $LOGS_DIR${NC}"
echo -e "${GREEN}[Celery Worker] Project root: $PROJECT_ROOT${NC}"

# Start Celery worker
# -A: app name
# -l: loglevel (debug, info, warning, error, critical)
# --logfile: log file path
# -c: concurrency (number of worker processes)
# -n: worker node name
cd "$BACKEND_DIR"

celery -A config worker \
    --loglevel=info \
    --logfile="$LOGS_DIR/celery-worker.log" \
    --concurrency=4 \
    -n worker@%h
