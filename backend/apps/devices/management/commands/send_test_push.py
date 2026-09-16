from __future__ import annotations

from django.core.management.base import BaseCommand, CommandError

from apps.devices.models import Device
from apps.devices.services import DevicePushService


class Command(BaseCommand):
    help = "Send a test Firebase Cloud Messaging notification to a registered device."

    def add_arguments(self, parser):
        parser.add_argument("device_id", help="UUID of the registered device.")
        parser.add_argument("--title", default="LiveKit Softphone test push")
        parser.add_argument(
            "--body",
            default="This is a test push notification from the backend.",
        )
        parser.add_argument(
            "--data",
            action="append",
            default=[],
            help="Optional key=value payload entry. Repeat for multiple values.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate the message with FCM without delivering it.",
        )

    def handle(self, *args, **options):
        device = Device.objects.filter(id=options["device_id"], is_active=True).first()
        if device is None:
            raise CommandError("Active device not found for the provided device_id.")

        data: dict[str, str] = {}
        for entry in options["data"]:
            if "=" not in entry:
                raise CommandError(
                    "Each --data value must use the key=value format."
                )

            key, value = entry.split("=", 1)
            data[key] = value

        result = DevicePushService.send_to_devices(
            devices=[device],
            title=options["title"],
            body=options["body"],
            data=data,
            dry_run=options["dry_run"],
        )

        self.stdout.write(
            self.style.SUCCESS(
                "FCM send complete: "
                f"successes={result.success_count} failures={result.failure_count}"
            )
        )

        if result.message_ids:
            self.stdout.write(
                f"Message IDs: {', '.join(result.message_ids)}"
            )

        if result.failed_tokens:
            self.stdout.write(
                self.style.WARNING(
                    f"Failed tokens: {', '.join(result.failed_tokens)}"
                )
            )