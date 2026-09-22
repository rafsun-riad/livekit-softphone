"""
Celery tasks for call management.
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import Call, CallState

logger = logging.getLogger(__name__)


@shared_task(
    name="apps.calls.tasks.cleanup_stale_ringing_calls",
    max_retries=3,
    default_retry_delay=60,
)
def cleanup_stale_ringing_calls():
    """
    Celery periodic task to cleanup all ringing calls that have exceeded the ring timeout.
    
    Runs every 30 seconds via Celery Beat.
    Finds all calls in RINGING state that are older than CALL_RING_TIMEOUT_SECONDS
    and marks them as TIMED_OUT with end_reason='not_answered'.
    """
    from django.conf import settings
    from .services import _record_event, _emit_call_payload

    try:
        now = timezone.now()
        timeout_threshold = now - timedelta(seconds=settings.CALL_RING_TIMEOUT_SECONDS)

        # Find all stale ringing calls
        stale_calls = Call.objects.filter(
            state=CallState.RINGING,
            ringing_at__lte=timeout_threshold,
        )

        count = 0
        for call in stale_calls:
            try:
                call.state = CallState.TIMED_OUT
                call.ended_at = now
                call.end_reason = "not_answered"
                call.save(update_fields=["state", "ended_at", "end_reason", "updated_at"])

                _record_event(call=call, event_type="call.timeout", actor_user=None)
                _emit_call_payload(call=call, event_type="call.timeout")

                count += 1
                logger.info(
                    f"Call {call.id} timed out (user didn't answer). "
                    f"Ringing duration: {(now - call.ringing_at).total_seconds():.1f}s"
                )
            except Exception as e:
                logger.error(f"Error timing out call {call.id}: {str(e)}", exc_info=True)
                continue

        if count > 0:
            logger.info(f"Cleanup task completed: {count} stale calls timed out")

        return {
            "status": "success",
            "cleaned_calls": count,
            "timestamp": now.isoformat(),
        }

    except Exception as e:
        logger.error(f"Cleanup task failed: {str(e)}", exc_info=True)
        raise
