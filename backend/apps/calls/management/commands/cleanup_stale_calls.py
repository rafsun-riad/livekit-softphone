"""
Management command to manually cleanup stale ringing calls.
Usage: python manage.py cleanup_stale_calls
"""

import logging
from datetime import timedelta

from apps.calls.models import Call, CallState
from apps.calls.services import _emit_call_payload, _record_event
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Manually cleanup all stale ringing calls (older than CALL_RING_TIMEOUT_SECONDS)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be cleaned up without making changes",
        )

    def handle(self, *args, **options):
        dry_run = options.get("dry_run", False)

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Call Cleanup Task"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write("")

        # Calculate timeout threshold
        now = timezone.now()
        timeout_threshold = now - timedelta(seconds=settings.CALL_RING_TIMEOUT_SECONDS)

        self.stdout.write(f"Current time: {now}")
        self.stdout.write(f"Timeout threshold: {timeout_threshold}")
        self.stdout.write(f"Timeout seconds: {settings.CALL_RING_TIMEOUT_SECONDS}")
        self.stdout.write("")

        # Find stale calls
        stale_calls = Call.objects.filter(
            state=CallState.RINGING,
            ringing_at__lte=timeout_threshold,
        ).order_by("ringing_at")

        count = stale_calls.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("✓ No stale calls found"))
            return

        self.stdout.write(self.style.WARNING(f"Found {count} stale calls:"))
        self.stdout.write("")

        for call in stale_calls:
            ringing_duration = (now - call.ringing_at).total_seconds()
            self.stdout.write(
                f"  ID: {call.id}"
                f" | Duration: {ringing_duration:.1f}s"
                f" | Started: {call.ringing_at}"
            )

        self.stdout.write("")

        if dry_run:
            self.stdout.write(
                self.style.WARNING(f"DRY RUN: Would cleanup {count} calls")
            )
            self.stdout.write(
                self.style.WARNING("Run without --dry-run to actually cleanup")
            )
            return

        # Perform cleanup
        cleaned_count = 0
        error_count = 0

        self.stdout.write("Cleaning up calls...")
        self.stdout.write("")

        for call in stale_calls:
            try:
                call.state = CallState.TIMED_OUT
                call.ended_at = now
                call.end_reason = "not_answered"
                call.save(
                    update_fields=["state", "ended_at", "end_reason", "updated_at"]
                )

                _record_event(call=call, event_type="call.timeout", actor_user=None)
                _emit_call_payload(call=call, event_type="call.timeout")

                ringing_duration = (now - call.ringing_at).total_seconds()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Cleaned up call {call.id} ({ringing_duration:.1f}s)"
                    )
                )
                cleaned_count += 1

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f"✗ Error cleaning call {call.id}: {e!s}")
                )
                logger.error(f"Error cleaning call {call.id}: {e!s}", exc_info=True)

        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write(
            self.style.SUCCESS(f"Cleanup completed: {cleaned_count} calls cleaned")
        )
        if error_count > 0:
            self.stdout.write(self.style.WARNING(f"Errors: {error_count}"))
        self.stdout.write("=" * 60)
