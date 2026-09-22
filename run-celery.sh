#!/bin/bash
#
# Start both Celery Worker and Beat
# Useful for development environment
# Run from project root
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get project root (directory where this script is located)
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_PATH="$BACKEND_DIR/.venv"
LOGS_DIR="$BACKEND_DIR/media/logs"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Celery Worker & Beat Starter (Dev Mode)   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}[Setup] Error: Virtual environment not found at $VENV_PATH${NC}"
    exit 1
fi

# Activate virtualenv
source "$VENV_PATH/bin/activate"

# Create logs directory
mkdir -p "$LOGS_DIR"

echo -e "${YELLOW}[Setup] Project root: $PROJECT_ROOT${NC}"
echo -e "${YELLOW}[Setup] Backend dir: $BACKEND_DIR${NC}"
echo -e "${YELLOW}[Setup] Logs directory: $LOGS_DIR${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}[Cleanup] Shutting down Celery processes...${NC}"
    
    # Kill worker if running
    if [ ! -z "$WORKER_PID" ]; then
        echo -e "${YELLOW}[Cleanup] Stopping worker (PID: $WORKER_PID)${NC}"
        kill $WORKER_PID 2>/dev/null || true
    fi
    
    # Kill beat if running
    if [ ! -z "$BEAT_PID" ]; then
        echo -e "${YELLOW}[Cleanup] Stopping beat (PID: $BEAT_PID)${NC}"
        kill $BEAT_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}[Cleanup] Done${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start Worker
echo -e "${GREEN}[Worker] Starting Celery worker...${NC}"
cd "$BACKEND_DIR"
export DJANGO_SETTINGS_MODULE=config.settings.dev

celery -A config worker \
    --loglevel=info \
    --logfile="$LOGS_DIR/celery-worker.log" \
    --concurrency=4 \
    -n worker@%h &
WORKER_PID=$!
echo -e "${GREEN}[Worker] Worker started with PID: $WORKER_PID${NC}"
echo -e "${GREEN}[Worker] Logs: $LOGS_DIR/celery-worker.log${NC}"
echo ""

# Small delay to let worker start
sleep 2

# Start Beat
echo -e "${GREEN}[Beat] Starting Celery beat...${NC}"

celery -A config beat \
    --loglevel=info \
    --logfile="$LOGS_DIR/celery-beat.log" \
    --scheduler django_celery_beat.schedulers:DatabaseScheduler &
BEAT_PID=$!
echo -e "${GREEN}[Beat] Beat started with PID: $BEAT_PID${NC}"
echo -e "${GREEN}[Beat] Logs: $LOGS_DIR/celery-beat.log${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Both services are running${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo -e "  Worker: tail -f $LOGS_DIR/celery-worker.log"
echo -e "  Beat:   tail -f $LOGS_DIR/celery-beat.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Wait for both processes
wait
