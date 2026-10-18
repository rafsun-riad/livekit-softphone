from __future__ import annotations

from dataclasses import dataclass

from apps.accounts.models import User
from apps.contacts.models import Contact, ContactStatus
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    Conversation,
    ConversationKind,
    ConversationParticipantState,
    Message,
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
        return message
