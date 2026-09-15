from apps.common.models import UUIDTimeStampedModel
from django.conf import settings
from django.db import models


class DevicePlatform(models.TextChoices):
    ANDROID = "android", "Android"
    IOS = "ios", "iOS"


class PushProvider(models.TextChoices):
    FCM = "fcm", "Firebase Cloud Messaging"


class Device(UUIDTimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="devices",
    )
    platform = models.CharField(max_length=20, choices=DevicePlatform.choices)
    push_provider = models.CharField(
        max_length=20,
        choices=PushProvider.choices,
        default=PushProvider.FCM,
    )
    push_token = models.TextField()
    app_version = models.CharField(max_length=50)
    device_label = models.CharField(max_length=150, blank=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    invalidated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "push_token"],
                name="devices_unique_user_push_token",
            )
        ]
        ordering = ["-last_seen_at"]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.platform}:{self.push_provider}"
