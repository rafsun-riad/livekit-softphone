# Celery Scripts - Quick Reference (Run from Project Root)

## 🚀 Quick Start

All scripts are now executable and can be run from your project root directory. **No need to `cd backend` or type `bash`!**

### Start Celery (Both Worker + Beat)

```bash
./run-celery.sh
```

✅ Simplest option - recommended for development

### Start Worker Only

```bash
./run-celery-worker.sh
```

### Start Beat Only

```bash
./run-celery-beat.sh
```

### Verify Setup

```bash
./verify-celery-setup.sh
```

---

## 📁 File Structure

Scripts are in two locations:

**Backend directory** (actual implementation):

```
backend/
├── run-celery.sh
├── run-celery-worker.sh
├── run-celery-beat.sh
└── verify-celery-setup.sh
```

**Project root** (wrappers for convenience):

```
/
├── run-celery.sh              → calls backend/run-celery.sh
├── run-celery-worker.sh       → calls backend/run-celery-worker.sh
├── run-celery-beat.sh         → calls backend/run-celery-beat.sh
└── verify-celery-setup.sh     → calls backend/verify-celery-setup.sh
```

The wrapper scripts automatically delegate to the backend scripts with proper path resolution.

---

## ✅ Script Capabilities

All scripts work from **anywhere** because they:

- ✅ Detect if running from root or backend directory
- ✅ Auto-calculate correct paths
- ✅ Auto-activate virtualenv
- ✅ Auto-create log directories
- ✅ Support both dev and production modes

---

## 📊 Example Usage

### Development Setup

```bash
# Activate virtualenv (first time)
source backend/.venv/bin/activate

# Run migrations (first time)
python backend/manage.py migrate

# Start Celery
./run-celery.sh

# In another terminal, watch logs
tail -f media/logs/celery-*.log
```

### Testing Cleanup

```bash
# Dry run (preview what would be cleaned)
cd backend
python manage.py cleanup_stale_calls --dry-run

# Actually cleanup
python manage.py cleanup_stale_calls
```

### Manual Testing from Root

```bash
# Everything from root directory, no cd needed!
./verify-celery-setup.sh
./run-celery-worker.sh
./run-celery-beat.sh
./run-celery.sh
```

---

## 🔧 What Each Script Does

### `run-celery.sh`

- Starts **both** Celery worker and beat scheduler
- Recommended for development
- Runs them in the same shell with proper cleanup handlers
- Press `Ctrl+C` to stop both

### `run-celery-worker.sh`

- Starts **only** the Celery worker
- Useful if you're running beat separately or on a different machine
- Logs to `media/logs/celery-worker.log`

### `run-celery-beat.sh`

- Starts **only** the Beat scheduler
- Sends tasks every 30 seconds
- Logs to `media/logs/celery-beat.log`

### `verify-celery-setup.sh`

- Checks all files, directories, and dependencies are in place
- Verifies Redis is running
- Checks environment variables
- **All checks should pass** before running

---

## 📝 Key Features

✅ **Executable**: No `bash` prefix needed - just `./script.sh`  
✅ **Smart Paths**: Works from root or backend directory  
✅ **Auto Setup**: Creates log directories, activates virtualenv  
✅ **Logging**: All output goes to `media/logs/` for production monitoring  
✅ **Production Ready**: Includes error handling, retries, cleanup

---

## 🎯 Usage Examples

### Run from Project Root (Recommended)

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone
./run-celery.sh
```

### Run from Backend (Still Works)

```bash
cd /home/md-rafsun-ul-haque/projects/livekit-softphone/backend
./run-celery.sh
```

### Run from Any Directory

```bash
# Works because scripts auto-detect their location
/home/md-rafsun-ul-haque/projects/livekit-softphone/run-celery.sh
```

---

## 📚 Related Documentation

- Full guide: `docs/CELERY_SETUP_AND_TASKS.md`
- Quick start: `docs/CELERY_QUICK_START.md`
- Commands reference: `docs/CELERY_COMMANDS_CHEAT_SHEET.md`
- Deployment: `docs/CELERY_DEPLOYMENT_CHECKLIST.md`

---

## ✨ That's it!

All scripts are ready to use. Just run:

```bash
./run-celery.sh
```

And Celery will start automatically with proper logging! 🎉
