from __future__ import annotations

import uuid

from apps.common.models import UUIDTimeStampedModel
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone


class ConversationKind(models.TextChoices):
    DIRECT = "direct", "Direct"


class MessageType(models.TextChoices):
    TEXT = "text", "Text"
    IMAGE = "image", "Image"
    VIDEO = "video", "Video"
    VOICE = "voice", "Voice"
    SYSTEM = "system", "System"


class AttachmentKind(models.TextChoices):
    IMAGE = "image", "Image"
    VIDEO = "video", "Video"
    VOICE = "voice", "Voice"
    FILE = "file", "File"


class ReceiptStatus(models.TextChoices):
    SENT = "sent", "Sent"
    DELIVERED = "delivered", "Delivered"
    READ = "read", "Read"


class KeyAlgorithm(models.TextChoices):
    CURVE25519 = "curve25519", "Curve25519"


class Conversation(UUIDTimeStampedModel):
    kind = models.CharField(
        max_length=20,
        choices=ConversationKind.choices,
        default=ConversationKind.DIRECT,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_conversations",
        null=True,
        blank=True,
    )
    subject = models.CharField(max_length=255, blank=True)
    latest_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-latest_message_at", "-updated_at"]

    def __str__(self) -> str:
        return f"{self.id}:{self.kind}"


class ConversationParticipantState(UUIDTimeStampedModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="participants",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversation_states",
    )
    last_read_message = models.ForeignKey(
        "messaging.Message",
        on_delete=models.SET_NULL,
        related_name="+",
        null=True,
        blank=True,
    )
    last_read_at = models.DateTimeField(null=True, blank=True)
    muted_until = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    is_hidden = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "user"],
                name="messaging_unique_conversation_participant",
            )
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.conversation_id}:{self.user_id}"


class Message(UUIDTimeStampedModel):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="sent_messages",
        null=True,
        blank=True,
    )
    message_type = models.CharField(max_length=20, choices=MessageType.choices)
    client_message_id = models.CharField(max_length=100, blank=True)
    ciphertext = models.JSONField(default=dict, blank=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["conversation", "sender", "client_message_id"],
                condition=~Q(client_message_id=""),
                name="messaging_unique_client_message_per_sender",
            )
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.conversation_id}:{self.message_type}:{self.id}"


class MessageAttachment(UUIDTimeStampedModel):
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    attachment_kind = models.CharField(
        max_length=20,
        choices=AttachmentKind.choices,
    )
    storage_key = models.CharField(max_length=500)
    encrypted_key_material = models.TextField()
    mime_type = models.CharField(max_length=150)
    size_bytes = models.PositiveBigIntegerField()
    sha256_hex = models.CharField(max_length=64)
    duration_ms = models.PositiveIntegerField(null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.message_id}:{self.attachment_kind}"


class MessageReceipt(UUIDTimeStampedModel):
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="receipts",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_receipts",
    )
    status = models.CharField(max_length=20, choices=ReceiptStatus.choices)
    status_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["message", "user"],
                name="messaging_unique_message_receipt_user",
            )
        ]
        ordering = ["status_at"]

    def __str__(self) -> str:
        return f"{self.message_id}:{self.user_id}:{self.status}"


class UserIdentityKey(UUIDTimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="identity_keys",
    )
    installation_id = models.UUIDField(null=True, blank=True)
    device_label = models.CharField(max_length=150, blank=True)
    algorithm = models.CharField(
        max_length=50,
        choices=KeyAlgorithm.choices,
        default=KeyAlgorithm.CURVE25519,
    )
    public_key = models.TextField()
    fingerprint = models.CharField(max_length=128, blank=True)
    is_active = models.BooleanField(default=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user_id}:{self.installation_id or uuid.UUID(int=0)}"


class SignedPreKey(UUIDTimeStampedModel):
    identity_key = models.ForeignKey(
        UserIdentityKey,
        on_delete=models.CASCADE,
        related_name="signed_pre_keys",
    )
    key_id = models.PositiveIntegerField()
    public_key = models.TextField()
    signature = models.TextField()
    expires_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["identity_key", "key_id"],
                name="messaging_unique_signed_pre_key_id",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.identity_key_id}:{self.key_id}"


class OneTimePreKey(UUIDTimeStampedModel):
    identity_key = models.ForeignKey(
        UserIdentityKey,
        on_delete=models.CASCADE,
        related_name="one_time_pre_keys",
    )
    key_id = models.PositiveIntegerField()
    public_key = models.TextField()
    claimed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["identity_key", "key_id"],
                name="messaging_unique_one_time_pre_key_id",
            )
        ]
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.identity_key_id}:{self.key_id}"
