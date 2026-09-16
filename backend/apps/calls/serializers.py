from __future__ import annotations

from apps.accounts.serializers import UserDiscoverySerializer
from rest_framework import serializers

from .models import Call, CallEvent, CallType


class CallParticipantSerializer(UserDiscoverySerializer):
    class Meta(UserDiscoverySerializer.Meta):
        fields = (
            "id",
            "phone_number_normalized",
            "display_name",
            "first_name",
            "last_name",
        )
        read_only_fields = fields


class CallEventSerializer(serializers.ModelSerializer[CallEvent]):
    actor_user = CallParticipantSerializer(read_only=True)

    class Meta:
        model = CallEvent
        fields = ("id", "event_type", "actor_user", "payload", "created_at")
        read_only_fields = fields


class CallSerializer(serializers.ModelSerializer[Call]):
    initiator = CallParticipantSerializer(read_only=True)
    recipient = CallParticipantSerializer(read_only=True)
    can_accept = serializers.SerializerMethodField()
    can_reject = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    can_end = serializers.SerializerMethodField()

    class Meta:
        model = Call
        fields = (
            "id",
            "initiator",
            "recipient",
            "provider",
            "call_type",
            "state",
            "room_name",
            "initiated_at",
            "ringing_at",
            "accepted_at",
            "connected_at",
            "ended_at",
            "end_reason",
            "created_at",
            "updated_at",
            "can_accept",
            "can_reject",
            "can_cancel",
            "can_end",
        )
        read_only_fields = fields

    def _get_viewer_id(self):
        request = self.context.get("request")
        if request is not None and getattr(request, "user", None):
            return request.user.id
        viewer = self.context.get("viewer")
        return getattr(viewer, "id", None)

    def get_can_accept(self, obj: Call) -> bool:
        viewer_id = self._get_viewer_id()
        return bool(viewer_id == obj.recipient_id and obj.state == "ringing")

    def get_can_reject(self, obj: Call) -> bool:
        viewer_id = self._get_viewer_id()
        return bool(viewer_id == obj.recipient_id and obj.state == "ringing")

    def get_can_cancel(self, obj: Call) -> bool:
        viewer_id = self._get_viewer_id()
        return bool(
            viewer_id == obj.initiator_id and obj.state in {"initiated", "ringing"}
        )

    def get_can_end(self, obj: Call) -> bool:
        viewer_id = self._get_viewer_id()
        if viewer_id not in {obj.initiator_id, obj.recipient_id}:
            return False

        return obj.state in {"accepted", "connecting", "connected", "ending"}


class CallCreateSerializer(serializers.Serializer[dict[str, object]]):
    recipient_user_id = serializers.UUIDField()
    call_type = serializers.ChoiceField(choices=CallType.choices)


class JoinMediaResponseSerializer(serializers.Serializer[dict[str, object]]):
    provider = serializers.CharField()
    server_url = serializers.CharField()
    participant_token = serializers.CharField()
    expires_at = serializers.DateTimeField()
    call = CallSerializer()
