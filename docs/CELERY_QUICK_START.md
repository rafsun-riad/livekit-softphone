# Celery Periodic Task - Quick Start Guide

## What Was Done

✅ **Celery + Redis Integration**

- Added `celery[redis]>=5.3.0` and `django-celery-beat>=2.7.0` to dependencies
- Created Celery configuration file: `backend/config/celery.py`
- Updated Django settings with Celery configuration

✅ **Periodic Call Cleanup Task**

- Created `backend/apps/calls/tasks.py` with `cleanup_stale_ringing_calls()` task
- Runs every 30 seconds via Celery Beat
- Finds all RINGING calls older than 40 seconds
- Times them out with `end_reason="not_answered"`
- Broadcasts WebSocket events to both participants

✅ **Startup Scripts**

- `run-celery-worker.sh` - Start Celery worker
- `run-celery-beat.sh` - Start Celery Beat scheduler
- `run-celery.sh` - Start both together (recommended for dev)

✅ **Logging**

- Created `backend/media/logs/` directory with README
- Worker logs: `celery-worker.log`
- Beat logs: `celery-beat.log`
- Log files are created automatically

✅ **Management Command**

- Created `cleanup_stale_calls` Django management command
- Manual cleanup: `python manage.py cleanup_stale_calls`
- Dry-run mode: `python manage.py cleanup_stale_calls --dry-run`

✅ **Configuration**

- Updated `.env` with Celery settings
- Updated `.env.example` with Celery documentation
- Redis uses different database (6379/1) than Channels (6379/0)

---

## Quick Start (2 Minutes)

### 1. Install Dependencies

```bash
cd backend

# Using uv (recommended)
uv pip install -e .

# Or using pip
pip install -e .
```

### 2. Run Migrations (first time only)

```bash
python manage.py migrate
```

This creates tables for django-celery-beat.

### 3. Start Celery

**Option A: Both worker + beat together (Development)**

```bash
bash run-celery.sh
```

**Option B: Separate terminals (Production)**

Terminal 1:

```bash
bash run-celery-worker.sh
```

Terminal 2:

```bash
bash run-celery-beat.sh
```

### 4. Monitor Logs

```bash
# Watch both logs
tail -f media/logs/celery-*.log

# Or separately
tail -f media/logs/celery-worker.log  # In another terminal
tail -f media/logs/celery-beat.log    # In another terminal
```

---

## How It Works

### Automatic Cleanup Every 30 Seconds

```
30s interval → Beat wakes up
  ↓
Sends task to Worker: "cleanup_stale_ringing_calls"
  ↓
Worker finds all RINGING calls > 40 seconds old
  ↓
For each stale call:
  - state → TIMED_OUT
  - end_reason → "not_answered"
  - Record audit event
  - Broadcast to both users via WebSocket
  ↓
Log result: "X calls cleaned up"
```

### Timeline Example

```
T=0s    User A calls User B → state: RINGING
T=10s   No answer
T=30s   First cleanup runs, Call A still ringing (only 30s)
T=40s   Second cleanup runs, Call A timed out! → state: TIMED_OUT
        Both users notified via WebSocket
T=50s   User A tries new call → Works! (previous call is ended)
```

---

## Testing

### Test 1: Verify Cleanup is Running

```bash
# Watch logs
tail -f media/logs/celery-beat.log

# Should see every 30 seconds:
# [INFO] Scheduler: Sending due task cleanup-stale-calls
```

### Test 2: Manual Cleanup

```bash
# Dry run (show what would happen)
python manage.py cleanup_stale_calls --dry-run

# Actually cleanup
python manage.py cleanup_stale_calls
```

### Test 3: Simulate Stale Call

```bash
# In Django shell
python manage.py shell

from apps.calls.models import Call
from django.utils import timezone

# Find a ringing call
call = Call.objects.filter(state='ringing').first()

if call:
    # Make it 50 seconds old
    from datetime import timedelta
    call.ringing_at = timezone.now() - timedelta(seconds=50)
    call.save()
    print(f"Made call {call.id} stale")
```

Then wait up to 30 seconds and check:

```bash
# Should be cleaned up
python manage.py cleanup_stale_calls
```

### Test 4: Check Recent Cleanups

```bash
python manage.py shell

from apps.calls.models import CallEvent
from django.utils import timezone
from datetime import timedelta

# Last hour of timeout events
now = timezone.now()
events = CallEvent.objects.filter(
    event_type='call.timeout',
    created_at__gte=now - timedelta(hours=1)
).order_by('-created_at')

for event in events:
    print(f"Call {event.call_id}: {event.created_at}")
```

---

## Environment Variables

All needed variables are in `.env`:

```bash
# Redis broker (different from Channels)
CELERY_BROKER_URL=redis://127.0.0.1:6379/1
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1
```

**Why different database?**

- Channels uses DB 0
- Celery uses DB 1
- Prevents data conflicts

---

## Log Locations

All logs go to `backend/media/logs/`:

```
media/logs/
├── celery-worker.log   # Worker task execution
├── celery-beat.log     # Beat scheduler
└── README.md           # Log documentation
```

View logs:

```bash
tail -f backend/media/logs/celery-worker.log
tail -f backend/media/logs/celery-beat.log
```

---

## Files Created/Modified

### New Files

- `backend/config/celery.py` - Celery configuration
- `backend/apps/calls/tasks.py` - Cleanup task
- `backend/run-celery-worker.sh` - Worker startup
- `backend/run-celery-beat.sh` - Beat startup
- `backend/run-celery.sh` - Both startup (dev)
- `backend/apps/calls/management/commands/cleanup_stale_calls.py` - Manual command
- `backend/media/logs/README.md` - Log documentation
- `docs/CELERY_SETUP_AND_TASKS.md` - Full documentation

### Modified Files

- `backend/pyproject.toml` - Added celery + django-celery-beat
- `backend/config/__init__.py` - Import Celery app
- `backend/config/settings/base.py` - Added Celery + Beat config, django_celery_beat app
- `backend/.env` - Added Celery variables
- `backend/.env.example` - Added Celery variables documentation

---

## Troubleshooting

### Issue: "Redis connection refused"

**Fix**: Make sure Redis is running

```bash
redis-cli ping
# Should return: PONG
```

### Issue: Task not executing

**Fix**: Check Beat scheduler state

```bash
tail -f media/logs/celery-beat.log | grep -i "error\|exception"
```

### Issue: Worker processes not starting

**Fix**: Verify Python environment

```bash
source backend/.venv/bin/activate
celery --version  # Should work
```

### Issue: Large log files

**Solution**: Rotate logs with logrotate or truncate:

```bash
# Safely truncate old logs
> media/logs/celery-worker.log
> media/logs/celery-beat.log
```

---

## Production Considerations

1. **Use systemd services** instead of shell scripts
2. **Set concurrency**: `--concurrency=8` for multi-core
3. **Monitor with Flower**: `pip install flower && celery -A config flower`
4. **Log rotation**: Use logrotate for large deployments
5. **Separate Redis**: Dedicated Redis instance for Celery
6. **Resource limits**: Set task time limits to prevent hanging

Example systemd service in `docs/CELERY_SETUP_AND_TASKS.md`

---

## Additional Resources

- Full documentation: `docs/CELERY_SETUP_AND_TASKS.md`
- Call cleanup task analysis: `docs/CALL_TIMEOUT_IMPLEMENTATION_SUMMARY.md`
- Testing guide: `docs/CALL_TIMEOUT_TESTING_GUIDE.md`
- Celery docs: https://docs.celeryproject.org/

---

## Summary

✅ Periodic cleanup every 30 seconds
✅ Stale calls (> 40s) automatically timed out
✅ WebSocket notifications to both participants
✅ Automatic logging to `media/logs/`
✅ Manual cleanup command available
✅ Simple, production-ready, no over-engineering

Just run `bash run-celery.sh` and it works! 🚀
