# Celery Commands Cheat Sheet

## Quick Start

```bash
# Install (first time)
cd backend
uv pip install -e .

# Verify setup
bash verify-celery-setup.sh

# Run migrations (first time)
python manage.py migrate

# Start Celery (both worker + beat)
bash run-celery.sh
```

---

## Starting Celery

### Option 1: Both Worker + Beat (Recommended for Dev)

```bash
bash run-celery.sh
```

### Option 2: Worker Only

```bash
bash run-celery-worker.sh

# Or manual:
celery -A config worker --loglevel=info --logfile=media/logs/celery-worker.log
```

### Option 3: Beat Only

```bash
bash run-celery-beat.sh

# Or manual:
celery -A config beat --loglevel=info --logfile=media/logs/celery-beat.log
```

### Option 4: Both Separate

```bash
# Terminal 1
bash run-celery-worker.sh

# Terminal 2
bash run-celery-beat.sh
```

---

## Viewing Logs

```bash
# Both logs (live)
tail -f backend/media/logs/celery-*.log

# Worker logs only
tail -f backend/media/logs/celery-worker.log

# Beat logs only
tail -f backend/media/logs/celery-beat.log

# Search for errors
grep -i error backend/media/logs/celery-*.log

# Search for timeouts
grep -i timeout backend/media/logs/celery-*.log

# Last 50 lines
tail -50 backend/media/logs/celery-worker.log
```

---

## Manual Cleanup Commands

```bash
# Show what would be cleaned (dry-run)
python manage.py cleanup_stale_calls --dry-run

# Actually cleanup
python manage.py cleanup_stale_calls

# Verbose cleanup
python manage.py cleanup_stale_calls --verbosity=2
```

---

## Django Shell Commands

```bash
python manage.py shell

# Import what you need
from apps.calls.models import Call, CallEvent, CallState
from apps.calls.tasks import cleanup_stale_ringing_calls
from django.utils import timezone
from datetime import timedelta

# Check stale calls
now = timezone.now()
threshold = now - timedelta(seconds=40)
stale = Call.objects.filter(state=CallState.RINGING, ringing_at__lte=threshold)
print(f"Stale calls: {stale.count()}")

# View recent timeout events
events = CallEvent.objects.filter(
    event_type='call.timeout'
).order_by('-created_at')[:10]
for e in events:
    print(f"{e.call_id}: {e.created_at}")

# Manually run task
result = cleanup_stale_ringing_calls()
print(result)

# Exit shell
exit()
```

---

## Monitoring & Debugging

### Check if Services Running

```bash
# Check all celery processes
ps aux | grep celery

# Check specific services
pgrep -af "celery worker"
pgrep -af "celery beat"
```

### Check Redis Connection

```bash
# Test Redis
redis-cli ping
# Should return: PONG

# Check Celery broker
redis-cli -n 1 ping
# Should return: PONG (DB 1 is Celery)

# View Redis info
redis-cli info
redis-cli -n 1 keys "*"  # See Celery keys
```

### Test Task Execution

```bash
python manage.py shell

from apps.calls.tasks import cleanup_stale_ringing_calls

# Execute task synchronously
result = cleanup_stale_ringing_calls()
print(result)

# Expected output:
# {'status': 'success', 'cleaned_calls': X, 'timestamp': '...'}
```

---

## Simulate Stale Calls (for testing)

```python
# In Django shell:
from apps.calls.models import Call
from django.utils import timezone
from datetime import timedelta

# Find a ringing call
call = Call.objects.filter(state='ringing').first()

if call:
    # Make it 50 seconds old
    call.ringing_at = timezone.now() - timedelta(seconds=50)
    call.save()
    print(f"Made call {call.id} stale")

    # Now run cleanup
    from apps.calls.tasks import cleanup_stale_ringing_calls
    result = cleanup_stale_ringing_calls()
    print(result)
```

---

## Production Tasks

### Install Flower (Monitoring)

```bash
pip install flower

# Start Flower
celery -A config flower

# Access at http://localhost:5555
```

### Run with Concurrency

```bash
# 8 concurrent workers
celery -A config worker --concurrency=8 --loglevel=info

# Auto-detect CPU count
celery -A config worker --concurrency=auto --loglevel=info
```

### Check Registered Tasks

```bash
celery -A config inspect registered
```

### Check Active Tasks

```bash
celery -A config inspect active
```

### Check Worker Stats

```bash
celery -A config inspect stats
```

### Shutdown Workers

```bash
# Graceful shutdown
celery -A config control shutdown

# Or kill process
kill $(pgrep -af "celery worker")
```

---

## Troubleshooting

### Issue: "Connection refused"

```bash
# Check Redis
redis-cli ping

# If not running, start Redis
redis-server

# Or on macOS with Homebrew
brew services start redis
```

### Issue: "ModuleNotFoundError: No module named 'celery'"

```bash
# Install dependencies
cd backend
uv pip install -e .

# Or
pip install celery[redis] django-celery-beat
```

### Issue: "No module named 'django_celery_beat'"

```bash
# Install dependencies
uv pip install -e .
```

### Issue: Task not running

```bash
# Check Beat logs
tail -f backend/media/logs/celery-beat.log

# Check Worker logs
tail -f backend/media/logs/celery-worker.log

# Verify Beat is sending tasks (should see every 30s):
grep "Sending due task" backend/media/logs/celery-beat.log
```

### Issue: Worker not receiving tasks

```bash
# Verify worker is running
ps aux | grep "celery worker"

# Check Redis connection
redis-cli -n 1 ping

# Check worker logs for errors
tail -f backend/media/logs/celery-worker.log | grep -i error
```

### Issue: Large log files

```bash
# Truncate old logs
> backend/media/logs/celery-worker.log
> backend/media/logs/celery-beat.log

# Or use logrotate (see CELERY_SETUP_AND_TASKS.md)
```

---

## Environment Variables

```bash
# In .env file:

# Broker connection
CELERY_BROKER_URL=redis://127.0.0.1:6379/1

# Result backend
CELERY_RESULT_BACKEND=redis://127.0.0.1:6379/1
```

---

## Files & Locations

```
backend/
├── config/celery.py                          # Celery app + Beat schedule
├── config/__init__.py                        # Imports Celery
├── config/settings/base.py                   # Celery config
├── apps/calls/tasks.py                       # Cleanup task
├── apps/calls/management/commands/
│   └── cleanup_stale_calls.py                # Manual command
├── run-celery.sh                             # Start both
├── run-celery-worker.sh                      # Start worker
├── run-celery-beat.sh                        # Start beat
├── verify-celery-setup.sh                    # Verification script
├── .env                                      # With Celery config
├── .env.example                              # Template
└── media/logs/
    ├── celery-worker.log                     # Worker logs
    ├── celery-beat.log                       # Beat logs
    └── README.md                             # Log docs
```

---

## Quick Reference Table

| Task            | Command                                          |
| --------------- | ------------------------------------------------ |
| Start Celery    | `bash run-celery.sh`                             |
| View logs       | `tail -f media/logs/celery-*.log`                |
| Manual cleanup  | `python manage.py cleanup_stale_calls`           |
| Dry run         | `python manage.py cleanup_stale_calls --dry-run` |
| Check setup     | `bash verify-celery-setup.sh`                    |
| Test Redis      | `redis-cli ping`                                 |
| Installed tasks | `celery -A config inspect registered`            |
| Active tasks    | `celery -A config inspect active`                |

---

## Next Steps

1. **First time setup**:

   ```bash
   cd backend
   uv pip install -e .
   python manage.py migrate
   bash verify-celery-setup.sh
   ```

2. **Start services**:

   ```bash
   bash run-celery.sh
   ```

3. **Monitor**:

   ```bash
   tail -f media/logs/celery-*.log
   ```

4. **Test cleanup**:
   ```bash
   python manage.py cleanup_stale_calls --dry-run
   ```

---

## More Information

- Full Guide: `docs/CELERY_SETUP_AND_TASKS.md`
- Quick Start: `docs/CELERY_QUICK_START.md`
- Celery Docs: https://docs.celeryproject.org/
