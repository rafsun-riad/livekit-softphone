import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("livekit_softphone")

# Load configuration from Django settings using namespace
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()

# Configure periodic tasks (Beat schedule)
app.conf.beat_schedule = {
    "cleanup-stale-calls": {
        "task": "apps.calls.tasks.cleanup_stale_ringing_calls",
        "schedule": 3.0,  # Run every 3 seconds
    },
}

# Additional Celery configuration
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
)


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
