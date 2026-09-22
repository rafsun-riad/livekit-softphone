#!/bin/bash
#
# Verification script to check Celery setup
# Usage: ./verify-celery-setup.sh
# Run from project root
#

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Celery Setup Verification                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Get project root (directory where this script is located)
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$PROJECT_ROOT/backend"

checks_passed=0
checks_failed=0

# Function to check if file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description: $file"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $description: $file (NOT FOUND)"
        ((checks_failed++))
    fi
}

# Function to check if directory exists
check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description: $dir"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $description: $dir (NOT FOUND)"
        ((checks_failed++))
    fi
}

# Function to check if command exists
check_command() {
    local cmd=$1
    local description=$2
    
    if command -v $cmd &> /dev/null; then
        echo -e "${GREEN}✓${NC} $description: $cmd"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} $description: $cmd (NOT FOUND)"
        ((checks_failed++))
    fi
}

echo -e "${YELLOW}[1] Checking Python files${NC}"
check_file "$BACKEND_DIR/config/celery.py" "Celery config"
check_file "$BACKEND_DIR/apps/calls/tasks.py" "Tasks file"
check_file "$BACKEND_DIR/apps/calls/management/commands/cleanup_stale_calls.py" "Management command"
echo ""

echo -e "${YELLOW}[2] Checking Startup Scripts${NC}"
check_file "$PROJECT_ROOT/run-celery.sh" "Celery starter"
check_file "$PROJECT_ROOT/run-celery-worker.sh" "Celery worker"
check_file "$PROJECT_ROOT/run-celery-beat.sh" "Celery beat"
echo ""

echo -e "${YELLOW}[3] Checking Configuration Files${NC}"
check_file "$BACKEND_DIR/.env" ".env file"
check_file "$BACKEND_DIR/.env.example" ".env.example file"
check_file "$BACKEND_DIR/pyproject.toml" "pyproject.toml"
echo ""

echo -e "${YELLOW}[4] Checking Documentation${NC}"
check_file "$PROJECT_ROOT/docs/CELERY_SETUP_AND_TASKS.md" "Full documentation"
check_file "$PROJECT_ROOT/docs/CELERY_QUICK_START.md" "Quick start guide"
check_file "$PROJECT_ROOT/docs/CELERY_IMPLEMENTATION_SUMMARY.md" "Implementation summary"
echo ""

echo -e "${YELLOW}[5] Checking Directories${NC}"
check_dir "$BACKEND_DIR/media/logs" "Logs directory (backend)"
echo ""

echo -e "${YELLOW}[6] Checking Environment (if activated)${NC}"
if [ -n "$VIRTUAL_ENV" ]; then
    echo -e "${GREEN}✓${NC} Python virtualenv: $VIRTUAL_ENV"
    ((checks_passed++))
    
    # Check if celery is installed
    if python -c "import celery" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Celery package installed"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} Celery package NOT installed (run: uv pip install -e .)"
        ((checks_failed++))
    fi
    
    if python -c "import django_celery_beat" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Django-celery-beat installed"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} Django-celery-beat NOT installed (run: uv pip install -e .)"
        ((checks_failed++))
    fi
else
    echo -e "${YELLOW}!${NC} Not in virtualenv - activate with: source backend/.venv/bin/activate"
fi
echo ""

echo -e "${YELLOW}[7] Checking Redis${NC}"
if command -v redis-cli &> /dev/null; then
    echo -e "${GREEN}✓${NC} redis-cli found"
    ((checks_passed++))
    
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis is running"
        ((checks_passed++))
    else
        echo -e "${RED}✗${NC} Redis is NOT running (start with: redis-server)"
        ((checks_failed++))
    fi
else
    echo -e "${YELLOW}!${NC} redis-cli not found - but Redis might still be running"
fi
echo ""

echo -e "${YELLOW}[8] Checking .env variables${NC}"
if grep -q "CELERY_BROKER_URL" "$BACKEND_DIR/.env"; then
    echo -e "${GREEN}✓${NC} CELERY_BROKER_URL set in .env"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} CELERY_BROKER_URL NOT set in .env"
    ((checks_failed++))
fi

if grep -q "CELERY_RESULT_BACKEND" "$BACKEND_DIR/.env"; then
    echo -e "${GREEN}✓${NC} CELERY_RESULT_BACKEND set in .env"
    ((checks_passed++))
else
    echo -e "${RED}✗${NC} CELERY_RESULT_BACKEND NOT set in .env"
    ((checks_failed++))
fi
echo ""

echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $checks_passed${NC}"
echo -e "${RED}Failed: $checks_failed${NC}"
echo -e "${BLUE}════════════════════════════════════════════${NC}"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Activate virtualenv: source backend/.venv/bin/activate"
    echo "2. Run migrations:      cd backend && python manage.py migrate"
    echo "3. Start Celery:        ./run-celery.sh"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed - see above for details${NC}"
    echo ""
    exit 1
fi
