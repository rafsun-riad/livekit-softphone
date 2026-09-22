# Celery Setup & Call Cleanup Task

## Overview

Celery is configured to run periodic tasks using Redis as the message broker. The primary task is automatically cleaning up stale ringing calls after 40 seconds.

## Components

### 1. Celery Configuration
- **File**: `backend/config/celery.py`
- **Broker**: Redis (same as CHANNEL_LAYERS)
- **Result Backend**: Redis
- **Beat Schedule**: Runs cleanup task every 30 seconds

### 2. Periodic Task
- **File**: `backend/apps/calls/tasks.py`
- **Task**: `cleanup_stale_ringing_calls`
- **Frequency**: Every 30 seconds (via Beat)
- **Function**: Finds and times out all RINGING calls older than 40 seconds

### 3. Startup Scripts
- `run-celery-worker.sh` - Starts a Celery worker
- `run-celery-beat.sh` - Starts the Beat scheduler
- `run-celery.sh` - Starts both worker and beat together

### 4. Logging
- Location: `media/logs/`
- Worker logs: `celery-worker.log`
- Beat logs: `celery-beat.log`

## Installation

### 1. Install Dependencies

```bash
# From backend directory
cd backend

# Using uv (recommended)
uv pip install -e .

# Or using pip
pip install -e .
```

### 2. Update Environment Variables

Copy `.env.example` to `.env` and add Celery config:

```bash
# Redis broker (usually different database than channels)
CELERY_BROKER_URL=redis://127.0.0.1:6379/1
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1
```

### 3. Run Database Migrations

```bash
# Required for django-celery-beat
python manage.py migrate
```

## Running Celery

### Option 1: Start Both (Recommended for Development)

```bash
bash run-celery.sh
```

This will:
- Start the Celery worker
- Start Celery Beat scheduler
- Show both PIDs
- Provide log file paths

### Option 2: Start Separately (For Production)

**Terminal 1 - Celery Worker:**
```bash
bash run-celery-worker.sh
```

**Terminal 2 - Celery Beat:**
```bash
bash run-celery-beat.sh
```

### Option 3: Manual Commands

**Worker:**
```bash
celery -A config worker --loglevel=info --logfile=media/logs/celery-worker.log
```

**Beat:**
```bash
celery -A config beat --loglevel=info --logfile=media/logs/celery-beat.log
```

## Monitoring

### View Live Logs

```bash
# Worker logs
tail -f media/logs/celery-worker.log

# Beat logs
tail -f media/logs/celery-beat.log

# Both logs together
tail -f media/logs/celery-*.log
```

### Check Task Execution

```bash
# From Django shell
python manage.py shell

from apps.calls.models import CallEvent
from django.utils import timezone

# View recent timeout events
events = CallEvent.objects.filter(
    event_type='call.timeout'
).order_by('-created_at')[:10]

for event in events:
    print(f"Call {event.call_id}: {event.created_at}")
```

### Celery Monitoring Tools (Optional)

For production, consider using:
- **Flower**: Real-time Celery monitoring dashboard
  ```bash
  pip install flower
  celery -A config flower
  # Access at http://localhost:5555
  ```

## How It Works

### Automatic Cleanup Flow

```
Every 30 seconds:
  ↓
Celery Beat wakes up
  ↓
Triggers cleanup_stale_ringing_calls task
  ↓
Celery Worker executes task:
  1. Query all calls in RINGING state
  2. Filter by ringing_at < (now - 40 seconds)
  3. For each stale call:
     - Set state → TIMED_OUT
     - Set end_reason → "not_answered"
     - Set ended_at → now
     - Record timeout event
     - Broadcast WebSocket event to both participants
  ↓
Log result (X calls cleaned up)
```

## Task Details

### `cleanup_stale_ringing_calls`

**Location**: `backend/apps/calls/tasks.py`

**What it does**:
```python
# Finds all RINGING calls older than CALL_RING_TIMEOUT_SECONDS (40 seconds)
stale_calls = Call.objects.filter(
    state=CallState.RINGING,
    ringing_at__lte=timeout_threshold,  # More than 40 seconds old
)

# For each stale call:
# 1. Change state to TIMED_OUT
# 2. Set end_reason to "not_answered"
# 3. Record audit event
# 4. Broadcast to both users via WebSocket
```

**Returns**:
```json
{
    "status": "success",
    "cleaned_calls": 5,
    "timestamp": "2026-09-22T12:34:56Z"
}
```

**Error Handling**:
- Retries up to 3 times on failure
- Logs errors without crashing
- Continues processing remaining calls if one fails

## Environment Configuration

### Required Variables

```bash
# Redis URLs (must use different databases)
REDIS_URL=redis://127.0.0.1:6379/0          # For channels
CELERY_BROKER_URL=redis://127.0.0.1:6379/1  # For celery
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1
```

### Optional Variables

All Celery settings are in `config/settings/base.py`:

```python
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_ENABLE_UTC = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60        # 30 minute hard limit
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60   # 25 minute soft limit
```

## Database Schema

Django-celery-beat stores schedules in the database. When migrations run, these tables are created:

- `django_celery_beat_periodictask` - Periodic task definitions
- `django_celery_beat_periodictaskchangedby` - Task change history
- `django_celery_beat_schedule` - Internal scheduler state

## Troubleshooting

### Beat not picking up tasks?

1. Check migrations ran:
   ```bash
   python manage.py migrate
   ```

2. Verify Redis is running:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. Check Beat logs:
   ```bash
   tail -f media/logs/celery-beat.log
   ```

4. Verify task is registered:
   ```bash
   celery -A config inspect registered
   ```

### Worker not processing tasks?

1. Verify worker is running:
   ```bash
   ps aux | grep celery
   ```

2. Check worker logs:
   ```bash
   tail -f media/logs/celery-worker.log
   ```

3. Verify Redis connection:
   ```bash
   redis-cli -n 1 ping
   ```

### Tasks not cleaning up calls?

1. Check task executions:
   ```bash
   celery -A config inspect active
   ```

2. Manually trigger cleanup:
   ```bash
   python manage.py shell
   from apps.calls.tasks import cleanup_stale_ringing_calls
   cleanup_stale_ringing_calls()
   ```

3. View recent cleanup results:
   ```bash
   tail -f media/logs/celery-worker.log | grep -i "timeout\|cleanup"
   ```

## Development Tips

### Run with Debug Logging

```bash
# Worker with debug logs
celery -A config worker --loglevel=debug

# Beat with debug logs
celery -A config beat --loglevel=debug
```

### Test Cleanup Manually

```bash
# From Django shell
python manage.py shell

# Import and run task directly
from apps.calls.tasks import cleanup_stale_ringing_calls
result = cleanup_stale_ringing_calls()
print(result)
```

### Simulate Stale Calls

```sql
-- In PostgreSQL, make a test call stale
UPDATE calls_call
SET ringing_at = NOW() - INTERVAL '50 seconds'
WHERE state = 'ringing'
LIMIT 1;
```

Then run cleanup to see it get picked up.

## Production Deployment

For production with multiple workers:

1. **Use supervisor or systemd** to manage worker/beat processes
2. **Set concurrency**: `celery worker --concurrency=8`
3. **Use persistent scheduler**: Already configured (DatabaseScheduler)
4. **Monitor with Flower**: Real-time task monitoring
5. **Set up alerts**: Monitor celery-beat.log for issues
6. **Use dedicated Redis**: Separate Redis instance for Celery

### Example Systemd Service

Create `/etc/systemd/system/celery-worker.service`:

```ini
[Unit]
Description=Celery Worker
After=network.target redis-server.service

[Service]
Type=forking
WorkingDirectory=/path/to/livekit-softphone/backend
ExecStart=/bin/bash run-celery-worker.sh
Restart=always
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl start celery-worker
sudo systemctl enable celery-worker
```

## Additional Resources

- [Celery Documentation](https://docs.celeryproject.org/)
- [Django-Celery-Beat](https://github.com/celery/django-celery-beat)
- [Celery Best Practices](https://docs.celeryproject.org/en/stable/userguide/tasks.html)
