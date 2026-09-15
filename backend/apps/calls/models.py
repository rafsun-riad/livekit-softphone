from apps.common.models import UUIDCreatedModel, UUIDTimeStampedModel
from django.conf import settings
from django.db import models
from django.db.models import Q


class CallProvider(models.TextChoices):
    LIVEKIT = "livekit", "LiveKit"


class CallType(models.TextChoices):
    AUDIO = "audio", "Audio"
    VIDEO = "video", "Video"


class CallState(models.TextChoices):
    INITIATED = "initiated", "Initiated"
    RINGING = "ringing", "Ringing"
    ACCEPTED = "accepted", "Accepted"
    CONNECTING = "connecting", "Connecting"
    CONNECTED = "connected", "Connected"
    ENDING = "ending", "Ending"
    ENDED = "ended", "Ended"
    REJECTED = "rejected", "Rejected"
    CANCELLED = "cancelled", "Cancelled"
    BUSY = "busy", "Busy"
    FAILED = "failed", "Failed"
    TIMED_OUT = "timed_out", "Timed out"


class Call(UUIDTimeStampedModel):
    initiator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="initiated_calls",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_calls",
    )
    provider = models.CharField(
        max_length=20,
        choices=CallProvider.choices,
        default=CallProvider.LIVEKIT,
    )
    call_type = models.CharField(max_length=20, choices=CallType.choices)
    state = models.CharField(
        max_length=20,
        choices=CallState.choices,
        default=CallState.INITIATED,
    )
    room_name = models.CharField(max_length=255, unique=True)
    initiated_at = models.DateTimeField(null=True, blank=True)
    ringing_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    connected_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    end_reason = models.CharField(max_length=100, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=~Q(initiator=models.F("recipient")),
                name="calls_initiator_not_recipient",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.id}:{self.call_type}:{self.state}"


class CallEvent(UUIDCreatedModel):
    call = models.ForeignKey(Call, on_delete=models.CASCADE, related_name="events")
    event_type = models.CharField(max_length=100)
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="call_events",
    )
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.call_id}:{self.event_type}"
