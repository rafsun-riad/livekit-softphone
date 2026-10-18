from __future__ import annotations

from apps.accounts.models import User
from apps.accounts.serializers import UserDiscoverySerializer
from django.db.models import Prefetch, QuerySet
from rest_framework import serializers

from .models import Conversation, ConversationParticipantState, Message, MessageType


class ConversationParticipantSerializer(
    serializers.ModelSerializer[ConversationParticipantState]
):
    user = UserDiscoverySerializer(read_only=True)

    class Meta:
        model = ConversationParticipantState
        fields = (
            "id",
            "user",
            "last_read_at",
            "archived_at",
            "is_hidden",
        )
        read_only_fields = fields


class MessageSummarySerializer(serializers.ModelSerializer[Message]):
    sender = UserDiscoverySerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            "id",
            "sender",
            "message_type",
            "created_at",
            "edited_at",
            "deleted_at",
        )
        read_only_fields = fields


class MessageSerializer(serializers.ModelSerializer[Message]):
    sender = UserDiscoverySerializer(read_only=True)

    class Meta:
        model = Message
        fields = (
            "id",
            "sender",
            "message_type",
            "client_message_id",
            "ciphertext",
            "created_at",
            "updated_at",
            "edited_at",
            "deleted_at",
        )
        read_only_fields = (
            "id",
            "sender",
            "created_at",
            "updated_at",
            "edited_at",
            "deleted_at",
        )


class ConversationSerializer(serializers.ModelSerializer[Conversation]):
    participants = ConversationParticipantSerializer(many=True, read_only=True)
    latest_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id",
            "kind",
            "subject",
            "latest_message_at",
            "created_at",
            "updated_at",
            "participants",
            "latest_message",
        )
        read_only_fields = fields

    def get_latest_message(self, obj: Conversation):
        latest_messages = getattr(obj, "prefetched_messages_desc", None)
        latest_message = (
            latest_messages[0]
            if latest_messages
            else obj.messages.select_related("sender").order_by("-created_at").first()
        )
        if latest_message is None:
            return None
        return MessageSummarySerializer(latest_message).data


class DirectConversationCreateSerializer(serializers.Serializer[dict[str, object]]):
    target_user_id = serializers.UUIDField()

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        request = self.context["request"]
        target_user = User.objects.filter(
            id=attrs["target_user_id"],
            is_active=True,
        ).first()

        if target_user is None:
            raise serializers.ValidationError(
                {"target_user_id": "The selected user does not exist."}
            )

        if target_user.id == request.user.id:
            raise serializers.ValidationError(
                {"target_user_id": "You cannot start a conversation with yourself."}
            )

        attrs["target_user"] = target_user
        return attrs


class MessageCreateSerializer(serializers.Serializer[dict[str, object]]):
    message_type = serializers.ChoiceField(choices=MessageType.choices)
    ciphertext = serializers.JSONField()
    client_message_id = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )


def prefetch_conversation_queryset(queryset: QuerySet[Conversation]):
    participant_queryset = ConversationParticipantState.objects.select_related("user")
    message_queryset = Message.objects.select_related("sender").order_by("-created_at")

    return queryset.prefetch_related(
        Prefetch("participants", queryset=participant_queryset),
        Prefetch(
            "messages",
            queryset=message_queryset,
            to_attr="prefetched_messages_desc",
        ),
    )
