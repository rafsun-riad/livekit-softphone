from apps.devices.models import Device
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "List registered devices available for push notification tests."

    def add_arguments(self, parser):
        parser.add_argument(
            "--inactive",
            action="store_true",
            help="Include inactive device registrations.",
        )

    def handle(self, *args, **options):
        devices = Device.objects.select_related("user").order_by("-last_seen_at")
        if not options["inactive"]:
            devices = devices.filter(is_active=True)

        if not devices.exists():
            self.stdout.write(
                "No registered devices found. Sign in on a real Android development "
                "build, grant notification permission, and run push sync from Settings."
            )
            return

        for device in devices:
            label = device.device_label or f"{device.platform} device"
            self.stdout.write(
                f"{device.id} | {device.user.phone_number_normalized} | "
                f"{label} | {device.push_provider} | "
                f"{'active' if device.is_active else 'inactive'}"
            )
