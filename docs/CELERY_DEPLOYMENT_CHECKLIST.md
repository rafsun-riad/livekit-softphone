# Celery Deployment Checklist

## Pre-Deployment Verification

### Code Changes ✅

- [ ] `config/celery.py` - Celery configuration file created
- [ ] `apps/calls/tasks.py` - Cleanup task created
- [ ] `config/__init__.py` - Celery app imported
- [ ] `config/settings/base.py` - Celery settings added
- [ ] `apps/calls/management/commands/cleanup_stale_calls.py` - Manual command created
- [ ] `pyproject.toml` - Dependencies updated (celery, django-celery-beat)

### Startup Scripts ✅

- [ ] `run-celery.sh` - Both worker + beat
- [ ] `run-celery-worker.sh` - Worker only
- [ ] `run-celery-beat.sh` - Beat only
- [ ] `verify-celery-setup.sh` - Verification script
- [ ] All scripts are executable: `chmod +x run-celery*.sh verify-*.sh`

### Configuration ✅

- [ ] `.env` - Has CELERY_BROKER_URL and CELERY_RESULT_BACKEND
- [ ] `.env.example` - Has Celery documentation
- [ ] Redis installed and running
- [ ] Redis DB 1 available for Celery (separate from DB 0 for Channels)

### Documentation ✅

- [ ] `docs/CELERY_SETUP_AND_TASKS.md` - Complete guide
- [ ] `docs/CELERY_QUICK_START.md` - 2-minute quick start
- [ ] `docs/CELERY_IMPLEMENTATION_SUMMARY.md` - Overview
- [ ] `docs/CELERY_COMMANDS_CHEAT_SHEET.md` - Commands reference
- [ ] `media/logs/README.md` - Log documentation

---

## Development Environment Setup

### Step 1: Install Dependencies

```bash
cd backend
uv pip install -e .
```

- [ ] Celery installed
- [ ] Django-celery-beat installed

### Step 2: Database Migrations

```bash
python manage.py migrate
```

- [ ] Creates django_celery_beat tables
- [ ] Runs all pending migrations

### Step 3: Verify Setup

```bash
bash verify-celery-setup.sh
```

- [ ] All checks pass
- [ ] Python packages available
- [ ] Redis connection works
- [ ] Log directory exists

### Step 4: Start Services

**Development (both in one process):**

```bash
bash run-celery.sh
```

**Production (separate terminals):**

```bash
# Terminal 1
bash run-celery-worker.sh

# Terminal 2
bash run-celery-beat.sh
```

- [ ] Worker started successfully
- [ ] Beat scheduler started successfully
- [ ] No connection errors

### Step 5: Monitor Logs

```bash
tail -f media/logs/celery-*.log
```

- [ ] Beat sending tasks every 30 seconds
- [ ] Worker executing cleanup tasks
- [ ] No errors in logs

---

## Testing (Pre-Deployment)

### Test 1: Verify Beat is Running

```bash
tail -f media/logs/celery-beat.log | grep "Sending"
```

- [ ] Should see "Sending due task cleanup-stale-calls" every 30 seconds

### Test 2: Verify Worker is Running

```bash
# Check logs for task execution
tail -f media/logs/celery-worker.log | grep "received"
```

- [ ] Should see cleanup tasks being executed

### Test 3: Manual Cleanup (Dry Run)

```bash
python manage.py cleanup_stale_calls --dry-run
```

- [ ] Shows stale calls found
- [ ] Doesn't modify database

### Test 4: Manual Cleanup (Real)

```bash
python manage.py cleanup_stale_calls
```

- [ ] Cleans up stale calls
- [ ] Updates call state to TIMED_OUT
- [ ] Records timeout events

### Test 5: Simulate Stale Call

```bash
# In Django shell:
from apps.calls.models import Call
from django.utils import timezone
from datetime import timedelta

call = Call.objects.filter(state='ringing').first()
if call:
    call.ringing_at = timezone.now() - timedelta(seconds=50)
    call.save()
```

Then run:

```bash
python manage.py cleanup_stale_calls
```

- [ ] Stale call is cleaned up

---

## Production Deployment

### Pre-Deployment

- [ ] All development tests pass
- [ ] Code reviewed
- [ ] Database backed up
- [ ] Redis available
- [ ] Supervisord/systemd ready

### Deployment Steps

#### 1. Deploy Code

```bash
# Pull latest code
git pull origin main

# Install dependencies
cd backend
uv pip install -e .
```

#### 2. Run Migrations

```bash
python manage.py migrate
```

#### 3. Setup Supervisor/Systemd

**Using Supervisor:**

```ini
# /etc/supervisor/conf.d/celery-worker.conf
[program:celery-worker]
command=bash /path/to/backend/run-celery-worker.sh
autostart=true
autorestart=true
stderr_logfile=/path/to/backend/media/logs/celery-worker.err.log
stdout_logfile=/path/to/backend/media/logs/celery-worker.out.log

# /etc/supervisor/conf.d/celery-beat.conf
[program:celery-beat]
command=bash /path/to/backend/run-celery-beat.sh
autostart=true
autorestart=true
stderr_logfile=/path/to/backend/media/logs/celery-beat.err.log
stdout_logfile=/path/to/backend/media/logs/celery-beat.out.log
```

Then:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start celery-worker celery-beat
```

**Using Systemd:**

```bash
# Copy service files
sudo cp systemd/celery-worker.service /etc/systemd/system/
sudo cp systemd/celery-beat.service /etc/systemd/system/

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable celery-worker celery-beat
sudo systemctl start celery-worker celery-beat
```

#### 4. Verify Running

```bash
# Check supervisor
sudo supervisorctl status celery-worker celery-beat

# Check systemd
sudo systemctl status celery-worker celery-beat

# Check processes
ps aux | grep celery
```

- [ ] Worker running
- [ ] Beat running
- [ ] No errors in logs

#### 5. Monitor Logs

```bash
# Watch production logs
tail -f /path/to/backend/media/logs/celery-*.log
```

- [ ] Tasks executing regularly
- [ ] No errors
- [ ] Cleanup happening every 30 seconds

### Post-Deployment

#### 1. Verify Setup

```bash
bash verify-celery-setup.sh
```

#### 2. Check Logs

```bash
# Worker logs
tail -50 media/logs/celery-worker.log

# Beat logs
tail -50 media/logs/celery-beat.log
```

#### 3. Test Cleanup

```bash
# Manual test
python manage.py cleanup_stale_calls --dry-run

# Check recent timeout events
python manage.py shell
# Query CallEvent.objects.filter(event_type='call.timeout')
```

#### 4. Monitor 24 Hours

- [ ] No crashes or restarts
- [ ] Consistent cleanup every 30 seconds
- [ ] No errors in logs
- [ ] Calls properly timed out after 40 seconds

---

## Rollback Plan

### If Issues Occur

1. **Stop Celery**:

   ```bash
   bash -c "pkill -f 'celery worker'"
   bash -c "pkill -f 'celery beat'"
   ```

2. **Revert Code** (if needed):

   ```bash
   git revert <commit-hash>
   ```

3. **Check Status**:

   ```bash
   tail -f media/logs/celery-*.log
   ```

4. **Restart**:
   ```bash
   bash run-celery.sh
   ```

---

## Monitoring After Deployment

### Daily Tasks

- [ ] Check celery-worker.log for errors
- [ ] Check celery-beat.log for execution
- [ ] Verify stale calls are being cleaned up
- [ ] No database growth of stale calls

### Weekly Tasks

- [ ] Review cleanup statistics (how many calls cleaned)
- [ ] Check for performance issues
- [ ] Verify log rotation is working
- [ ] Test manual cleanup command

### Monthly Tasks

- [ ] Performance review
- [ ] Consider Flower dashboard for monitoring
- [ ] Review and optimize logging
- [ ] Update documentation if needed

---

## Health Checks

### Automated Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "Checking Celery services..."

# Check worker
if pgrep -f "celery worker" > /dev/null; then
    echo "✓ Worker running"
else
    echo "✗ Worker NOT running"
    exit 1
fi

# Check beat
if pgrep -f "celery beat" > /dev/null; then
    echo "✓ Beat running"
else
    echo "✗ Beat NOT running"
    exit 1
fi

# Check Redis
if redis-cli -n 1 ping > /dev/null 2>&1; then
    echo "✓ Redis available"
else
    echo "✗ Redis NOT available"
    exit 1
fi

# Check recent logs
if grep -q "Cleanup task completed" media/logs/celery-worker.log; then
    echo "✓ Recent cleanup executed"
else
    echo "⚠ No recent cleanup in logs"
fi

echo "✓ All checks passed"
exit 0
```

Usage:

```bash
bash health-check.sh
```

---

## Troubleshooting Guide

### Problem: Tasks Not Executing

**Check 1**: Redis running?

```bash
redis-cli -n 1 ping
```

**Check 2**: Beat sending tasks?

```bash
grep "Sending due task" media/logs/celery-beat.log | tail
```

**Check 3**: Worker receiving tasks?

```bash
grep "received" media/logs/celery-worker.log | tail
```

**Solution**: Restart both services

```bash
pkill -f celery
bash run-celery.sh
```

### Problem: High Memory Usage

**Check**: Number of worker processes

```bash
ps aux | grep "celery worker" | wc -l
```

**Solution**: Reduce concurrency

```bash
# In run-celery-worker.sh, change:
celery -A config worker --concurrency=2  # Reduce from 4
```

### Problem: Database Growing Large

**Check**: Old timeout events

```bash
python manage.py shell
from apps.calls.models import CallEvent
CallEvent.objects.filter(event_type='call.timeout').count()
```

**Solution**: Archive/delete old events periodically

```python
from django.utils import timezone
from datetime import timedelta

# Delete events older than 30 days
threshold = timezone.now() - timedelta(days=30)
CallEvent.objects.filter(created_at__lt=threshold).delete()
```

---

## Success Criteria

✅ All deployed when:

- [ ] Worker running without errors
- [ ] Beat scheduler running without errors
- [ ] Tasks executing every 30 seconds
- [ ] Stale calls being cleaned up after 40 seconds
- [ ] WebSocket notifications working
- [ ] No errors in logs for 24 hours
- [ ] Users can make new calls after stale calls timeout
- [ ] All manual tests passing

---

## Reference Documents

- Deployment notes: This file
- Quick start: `docs/CELERY_QUICK_START.md`
- Full guide: `docs/CELERY_SETUP_AND_TASKS.md`
- Commands: `docs/CELERY_COMMANDS_CHEAT_SHEET.md`
- Celery docs: https://docs.celeryproject.org/
