from __future__ import annotations

from dataclasses import dataclass

from apps.accounts.models import User
from apps.calls.realtime import broadcast_user_event
from apps.contacts.models import Contact, ContactStatus
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    Conversation,
    ConversationKind,
    ConversationParticipantState,
    Message,
    MessageReceipt,
    ReceiptStatus,
)
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    prefetch_conversation_queryset,
)


@dataclass
class MessagingServiceError(Exception):
    code: str
    message: str
    status_code: int
    details: dict | None = None


def _is_blocked_between(*, user: User, other_user: User) -> bool:
    return Contact.objects.filter(
        Q(owner=user, contact_user=other_user, status=ContactStatus.BLOCKED)
        | Q(owner=other_user, contact_user=user, status=ContactStatus.BLOCKED)
    ).exists()


def _assert_messaging_allowed(*, user: User, other_user: User):
    if _is_blocked_between(user=user, other_user=other_user):
        raise MessagingServiceError(
            code="conversation_blocked",
            message="Messaging is blocked between these users.",
            status_code=403,
        )


def get_user_conversation_queryset(*, user: User):
    return Conversation.objects.filter(participants__user=user).distinct()


def get_conversation_for_user(*, conversation_id, user: User) -> Conversation:
    conversation = (
        get_user_conversation_queryset(user=user).filter(id=conversation_id).first()
    )
    if conversation is None:
        raise MessagingServiceError(
            code="conversation_not_found",
            message="Conversation not found.",
            status_code=404,
        )
    return conversation


def get_messages_for_user(*, conversation_id, user: User):
    conversation = get_conversation_for_user(conversation_id=conversation_id, user=user)
    return conversation.messages.select_related("sender").all()


def _serialize_conversation_for_user(*, conversation_id, user: User):
    conversation = prefetch_conversation_queryset(
        get_user_conversation_queryset(user=user).filter(id=conversation_id)
    ).first()
    if conversation is None:
        return None
    return ConversationSerializer(conversation).data


def _emit_message_created_events(*, message_id) -> None:
    message = (
        Message.objects.select_related("conversation", "sender")
        .filter(id=message_id)
        .first()
    )
    if message is None:
        return

    participant_states = message.conversation.participants.select_related("user")
    message_payload = {
        "conversation_id": str(message.conversation_id),
        "message": MessageSerializer(message).data,
    }

    for participant_state in participant_states:
        viewer = participant_state.user
        conversation_payload = _serialize_conversation_for_user(
            conversation_id=message.conversation_id,
            user=viewer,
        )
        if conversation_payload is not None:
            broadcast_user_event(
                user_id=viewer.id,
                event_type="conversation.updated",
                payload=conversation_payload,
            )

        if viewer.id != message.sender_id:
            broadcast_user_event(
                user_id=viewer.id,
                event_type="message.incoming",
                payload=message_payload,
            )


def _emit_message_receipt_events(*, receipt_ids: list) -> None:
    if not receipt_ids:
        return

    receipts = MessageReceipt.objects.select_related(
        "message", "message__conversation"
    ).filter(id__in=receipt_ids)

    for receipt in receipts:
        participant_ids = receipt.message.conversation.participants.values_list(
            "user_id", flat=True
        )
        payload = {
            "conversation_id": str(receipt.message.conversation_id),
            "message_id": str(receipt.message_id),
            "status": receipt.status,
            "status_at": receipt.status_at.isoformat(),
            "user_id": str(receipt.user_id),
        }
        for participant_id in participant_ids:
            broadcast_user_event(
                user_id=participant_id,
                event_type="message.receipt",
                payload=payload,
            )


class MessagingService:
    @staticmethod
    @transaction.atomic
    def get_or_create_direct_conversation(
        *, user: User, target_user: User
    ) -> tuple[Conversation, bool]:
        _assert_messaging_allowed(user=user, other_user=target_user)

        existing = (
            Conversation.objects.filter(kind=ConversationKind.DIRECT)
            .annotate(
                participant_count=Count("participants", distinct=True),
                matched_participant_count=Count(
                    "participants",
                    filter=Q(participants__user__in=[user, target_user]),
                    distinct=True,
                ),
            )
            .filter(participant_count=2, matched_participant_count=2)
            .order_by("created_at")
            .first()
        )
        if existing is not None:
            return existing, False

        conversation = Conversation.objects.create(
            kind=ConversationKind.DIRECT,
            created_by=user,
        )
        ConversationParticipantState.objects.create(
            conversation=conversation, user=user
        )
        ConversationParticipantState.objects.create(
            conversation=conversation,
            user=target_user,
        )
        return conversation, True

    @staticmethod
    @transaction.atomic
    def create_message(
        *,
        conversation_id,
        user: User,
        message_type: str,
        ciphertext: dict,
        client_message_id: str = "",
    ) -> Message:
        conversation = get_conversation_for_user(
            conversation_id=conversation_id, user=user
        )

        if conversation.kind == ConversationKind.DIRECT:
            counterpart = (
                conversation.participants.exclude(user=user)
                .select_related("user")
                .first()
            )
            if counterpart is not None:
                _assert_messaging_allowed(user=user, other_user=counterpart.user)

        message = Message.objects.create(
            conversation=conversation,
            sender=user,
            message_type=message_type,
            ciphertext=ciphertext,
            client_message_id=client_message_id,
        )
        latest_message_at = message.created_at or timezone.now()
        Conversation.objects.filter(id=conversation.id).update(
            latest_message_at=latest_message_at,
            updated_at=latest_message_at,
        )
        transaction.on_commit(
            lambda: _emit_message_created_events(message_id=message.id)
        )
        return message

    @staticmethod
    @transaction.atomic
    def mark_messages_read(
        *,
        conversation_id,
        user: User,
        message_id=None,
    ) -> int:
        conversation = get_conversation_for_user(
            conversation_id=conversation_id,
            user=user,
        )

        target_message = None
        if message_id is not None:
            target_message = conversation.messages.filter(id=message_id).first()
            if target_message is None:
                raise MessagingServiceError(
                    code="message_not_found",
                    message="Message not found in this conversation.",
                    status_code=404,
                )

        incoming_messages = conversation.messages.exclude(sender=user)
        if target_message is not None:
            incoming_messages = incoming_messages.filter(
                created_at__lte=target_message.created_at
            )

        incoming_messages = list(incoming_messages.order_by("created_at"))
        if not incoming_messages:
            return 0

        now = timezone.now()
        updated_receipt_ids: list = []

        for message in incoming_messages:
            receipt, created = MessageReceipt.objects.get_or_create(
                message=message,
                user=user,
                defaults={
                    "status": ReceiptStatus.READ,
                    "status_at": now,
                },
            )
            if created:
                updated_receipt_ids.append(receipt.id)
                continue

            if receipt.status != ReceiptStatus.READ:
                receipt.status = ReceiptStatus.READ
                receipt.status_at = now
                receipt.save(update_fields=["status", "status_at", "updated_at"])
                updated_receipt_ids.append(receipt.id)

        latest_read_message = incoming_messages[-1]
        ConversationParticipantState.objects.filter(
            conversation=conversation,
            user=user,
        ).update(
            last_read_message=latest_read_message,
            last_read_at=now,
            updated_at=now,
        )

        if updated_receipt_ids:
            transaction.on_commit(
                lambda: _emit_message_receipt_events(
                    receipt_ids=updated_receipt_ids,
                )
            )

        return len(updated_receipt_ids)
