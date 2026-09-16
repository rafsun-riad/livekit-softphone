from __future__ import annotations

from apps.devices.models import Device
from apps.devices.services import DevicePushService
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Send a test Firebase Cloud Messaging notification to a registered device."

    @staticmethod
    def build_available_devices_hint() -> str:
        devices = list(
            Device.objects.select_related("user")
            .filter(is_active=True)
            .order_by("-last_seen_at")[:10]
        )
        if not devices:
            return (
                "No active devices are registered. Sign in on a real Android "
                "development build, grant notification permission, and run push "
                "sync from the Settings screen first."
            )

        lines = ["Available active devices:"]
        for device in devices:
            label = device.device_label or f"{device.platform} device"
            lines.append(
                f"- {device.id} | {device.user.phone_number_normalized} | {label}"
            )
        return "\n".join(lines)

    def add_arguments(self, parser):
        parser.add_argument(
            "device_id",
            nargs="?",
            help="UUID of the registered device.",
        )
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
        parser.add_argument(
            "--latest",
            action="store_true",
            help="Target the most recently seen active registered device.",
        )

    def handle(self, *args, **options):
        device = None
        if options["latest"]:
            device = (
                Device.objects.filter(is_active=True).order_by("-last_seen_at").first()
            )
        elif options["device_id"]:
            device = Device.objects.filter(
                id=options["device_id"],
                is_active=True,
            ).first()
        else:
            raise CommandError("Provide a device_id or use --latest.")

        if device is None:
            raise CommandError(
                "Active device not found for the requested target.\n"
                f"{self.build_available_devices_hint()}"
            )

        data: dict[str, str] = {}
        for entry in options["data"]:
            if "=" not in entry:
                raise CommandError("Each --data value must use the key=value format.")

            key, value = entry.split("=", 1)
            data[key] = value

        result = DevicePushService.send_to_devices(
            devices=[device],
            title=options["title"],
            body=options["body"],
            data=data,
            dry_run=options["dry_run"],
        )

        self.stdout.write(f"Target device: {device.id}")

        self.stdout.write(
            self.style.SUCCESS(
                "FCM send complete: "
                f"successes={result.success_count} failures={result.failure_count}"
            )
        )

        if result.message_ids:
            self.stdout.write(f"Message IDs: {', '.join(result.message_ids)}")

        if result.failed_tokens:
            self.stdout.write(
                self.style.WARNING(f"Failed tokens: {', '.join(result.failed_tokens)}")
            )
