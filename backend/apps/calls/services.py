from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import timedelta

from apps.accounts.models import User
from apps.contacts.models import Contact, ContactStatus
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from livekit.api import AccessToken, VideoGrants

from .models import Call, CallEvent, CallState
from .realtime import broadcast_user_event, send_incoming_call_push
from .serializers import CallSerializer

ACTIVE_CALL_STATES = (
    CallState.INITIATED,
    CallState.RINGING,
    CallState.ACCEPTED,
    CallState.CONNECTING,
    CallState.CONNECTED,
    CallState.ENDING,
)


@dataclass
class CallServiceError(Exception):
    code: str
    message: str
    status_code: int
    details: dict | None = None


def serialize_call_for_user(*, call: Call, user: User) -> dict:
    return CallSerializer(call, context={"viewer": user}).data


def _build_call_payload_for_participants(call: Call) -> dict[str, dict]:
    return {
        str(call.initiator_id): serialize_call_for_user(call=call, user=call.initiator),
        str(call.recipient_id): serialize_call_for_user(call=call, user=call.recipient),
    }


def _emit_call_payload(*, call: Call, event_type: str) -> None:
    payloads = _build_call_payload_for_participants(call)
    broadcast_user_event(
        user_id=call.initiator_id,
        event_type=event_type,
        payload=payloads[str(call.initiator_id)],
    )
    broadcast_user_event(
        user_id=call.recipient_id,
        event_type=event_type,
        payload=payloads[str(call.recipient_id)],
    )


def _emit_incoming_call(call: Call) -> None:
    payload = serialize_call_for_user(call=call, user=call.recipient)
    broadcast_user_event(
        user_id=call.recipient_id,
        event_type="call.incoming",
        payload=payload,
    )


def _record_event(
    *,
    call: Call,
    event_type: str,
    actor_user: User | None,
    payload: dict | None = None,
) -> CallEvent:
    return CallEvent.objects.create(
        call=call,
        event_type=event_type,
        actor_user=actor_user,
        payload=payload or {},
    )


def _timeout_all_stale_ringing_calls() -> None:
    """
    Find and timeout all ringing calls that have exceeded the ring timeout.
    This proactively cleans up stale calls that are no longer being actively checked.
    """
    now = timezone.now()
    timeout_threshold = now - timedelta(seconds=settings.CALL_RING_TIMEOUT_SECONDS)

    # Find all ringing calls that started before the timeout threshold
    stale_calls = Call.objects.filter(
        state=CallState.RINGING,
        ringing_at__lte=timeout_threshold,
    )

    for call in stale_calls:
        call.state = CallState.TIMED_OUT
        call.ended_at = now
        call.end_reason = "not_answered"
        call.save(update_fields=["state", "ended_at", "end_reason", "updated_at"])
        _record_event(call=call, event_type="call.timeout", actor_user=None)
        # Emit timeout event to both participants
        transaction.on_commit(
            lambda c=call: _emit_call_payload(call=c, event_type="call.timeout")
        )


def _timeout_call_if_stale(call: Call) -> Call:
    if call.state != CallState.RINGING or call.ringing_at is None:
        return call

    timeout_at = call.ringing_at + timedelta(seconds=settings.CALL_RING_TIMEOUT_SECONDS)
    if timezone.now() < timeout_at:
        return call

    call.state = CallState.TIMED_OUT
    call.ended_at = timezone.now()
    call.end_reason = "not_answered"
    call.save(update_fields=["state", "ended_at", "end_reason", "updated_at"])
    _record_event(call=call, event_type="call.timeout", actor_user=None)
    transaction.on_commit(
        lambda: _emit_call_payload(call=call, event_type="call.timeout")
    )
    return call


def _get_call_for_user(*, call_id, user: User) -> Call:
    call = (
        Call.objects.select_related("initiator", "recipient")
        .filter(id=call_id)
        .filter(Q(initiator=user) | Q(recipient=user))
        .first()
    )
    if call is None:
        raise CallServiceError(
            code="call_not_found",
            message="Call not found.",
            status_code=404,
        )
    return _timeout_call_if_stale(call)


def _ensure_not_in_conflicting_call(*, user: User) -> None:
    # First, timeout any stale ringing calls to ensure they don't block new calls
    _timeout_all_stale_ringing_calls()

    has_conflict = (
        Call.objects.filter(state__in=ACTIVE_CALL_STATES)
        .filter(Q(initiator=user) | Q(recipient=user))
        .exists()
    )
    if has_conflict:
        raise CallServiceError(
            code="call_conflict",
            message="This user already has an active call.",
            status_code=409,
        )


class CallService:
    @staticmethod
    @transaction.atomic
    def create_call(*, initiator: User, recipient_user_id, call_type: str) -> Call:
        recipient = User.objects.filter(id=recipient_user_id, is_active=True).first()
        if recipient is None:
            raise CallServiceError(
                code="recipient_not_found",
                message="Recipient not found.",
                status_code=404,
            )

        if recipient.id == initiator.id:
            raise CallServiceError(
                code="call_not_allowed",
                message="You cannot call yourself.",
                status_code=400,
            )

        is_allowed = Contact.objects.filter(
            owner=initiator,
            contact_user=recipient,
            status=ContactStatus.ACCEPTED,
        ).exists()
        if not is_allowed:
            raise CallServiceError(
                code="call_not_allowed",
                message="You cannot call this user.",
                status_code=403,
            )

        _ensure_not_in_conflicting_call(user=initiator)

        # Also timeout stale calls for the recipient before checking for conflicts
        _timeout_all_stale_ringing_calls()

        recipient_has_conflict = (
            Call.objects.filter(state__in=ACTIVE_CALL_STATES)
            .filter(Q(initiator=recipient) | Q(recipient=recipient))
            .exists()
        )

        now = timezone.now()
        if recipient_has_conflict:
            call = Call.objects.create(
                initiator=initiator,
                recipient=recipient,
                call_type=call_type,
                state=CallState.BUSY,
                room_name=f"call_{uuid.uuid4().hex}",
                initiated_at=now,
                ended_at=now,
                end_reason=CallState.BUSY,
            )
            _record_event(call=call, event_type="call.busy", actor_user=None)

            transaction.on_commit(
                lambda: broadcast_user_event(
                    user_id=call.initiator_id,
                    event_type="call.ended",
                    payload=serialize_call_for_user(call=call, user=call.initiator),
                )
            )
            return call

        call = Call.objects.create(
            initiator=initiator,
            recipient=recipient,
            call_type=call_type,
            state=CallState.RINGING,
            room_name=f"call_{uuid.uuid4().hex}",
            initiated_at=now,
            ringing_at=now,
        )
        _record_event(
            call=call,
            event_type="call.initiated",
            actor_user=initiator,
            payload={"call_type": call_type},
        )

        caller_name = initiator.display_name or initiator.phone_number_normalized

        def on_commit() -> None:
            broadcast_user_event(
                user_id=call.initiator_id,
                event_type="call.updated",
                payload=serialize_call_for_user(call=call, user=call.initiator),
            )
            _emit_incoming_call(call)
            try:
                send_incoming_call_push(
                    user=recipient,
                    payload={
                        "call_id": str(call.id),
                        "call_type": call.call_type,
                        "initiator_id": str(initiator.id),
                        "initiator_name": caller_name,
                    },
                    caller_name=caller_name,
                )
            except Exception:
                return

        transaction.on_commit(on_commit)
        return call

    @staticmethod
    @transaction.atomic
    def get_call(*, call_id, user: User) -> Call:
        return _get_call_for_user(call_id=call_id, user=user)

    @staticmethod
    @transaction.atomic
    def accept_call(*, call_id, user: User) -> Call:
        call = _get_call_for_user(call_id=call_id, user=user)
        if call.recipient_id != user.id:
            raise CallServiceError(
                code="call_action_forbidden",
                message="Only the recipient can accept this call.",
                status_code=403,
            )
        if call.state != CallState.RINGING:
            raise CallServiceError(
                code="invalid_call_state",
                message="This call can no longer be accepted.",
                status_code=409,
            )

        call.state = CallState.ACCEPTED
        call.accepted_at = timezone.now()
        call.save(update_fields=["state", "accepted_at", "updated_at"])
        _record_event(call=call, event_type="call.accepted", actor_user=user)
        transaction.on_commit(
            lambda: _emit_call_payload(call=call, event_type="call.updated")
        )
        return call

    @staticmethod
    @transaction.atomic
    def reject_call(*, call_id, user: User) -> Call:
        call = _get_call_for_user(call_id=call_id, user=user)
        if call.recipient_id != user.id:
            raise CallServiceError(
                code="call_action_forbidden",
                message="Only the recipient can reject this call.",
                status_code=403,
            )
        if call.state != CallState.RINGING:
            raise CallServiceError(
                code="invalid_call_state",
                message="This call can no longer be rejected.",
                status_code=409,
            )

        call.state = CallState.REJECTED
        call.ended_at = timezone.now()
        call.end_reason = CallState.REJECTED
        call.save(update_fields=["state", "ended_at", "end_reason", "updated_at"])
        _record_event(call=call, event_type="call.rejected", actor_user=user)
        transaction.on_commit(
            lambda: _emit_call_payload(call=call, event_type="call.ended")
        )
        return call

    @staticmethod
    @transaction.atomic
    def cancel_call(*, call_id, user: User) -> Call:
        call = _get_call_for_user(call_id=call_id, user=user)
        if call.initiator_id != user.id:
            raise CallServiceError(
                code="call_action_forbidden",
                message="Only the caller can cancel this call.",
                status_code=403,
            )
        if call.state not in {CallState.INITIATED, CallState.RINGING}:
            raise CallServiceError(
                code="invalid_call_state",
                message="This call can no longer be cancelled.",
                status_code=409,
            )

        call.state = CallState.CANCELLED
        call.ended_at = timezone.now()
        call.end_reason = CallState.CANCELLED
        call.save(update_fields=["state", "ended_at", "end_reason", "updated_at"])
        _record_event(call=call, event_type="call.cancelled", actor_user=user)
        transaction.on_commit(
            lambda: _emit_call_payload(call=call, event_type="call.ended")
        )
        return call

    @staticmethod
    @transaction.atomic
    def end_call(*, call_id, user: User) -> Call:
        call = _get_call_for_user(call_id=call_id, user=user)
        if user.id not in {call.initiator_id, call.recipient_id}:
            raise CallServiceError(
                code="call_action_forbidden",
                message="Only call participants can end this call.",
                status_code=403,
            )
        if call.state not in {
            CallState.ACCEPTED,
            CallState.CONNECTING,
            CallState.CONNECTED,
            CallState.ENDING,
        }:
            raise CallServiceError(
                code="invalid_call_state",
                message="This call cannot be ended from its current state.",
                status_code=409,
            )

        call.state = CallState.ENDED
        call.ended_at = timezone.now()
        call.end_reason = CallState.ENDED
        call.save(update_fields=["state", "ended_at", "end_reason", "updated_at"])
        _record_event(call=call, event_type="call.ended", actor_user=user)
        transaction.on_commit(
            lambda: _emit_call_payload(call=call, event_type="call.ended")
        )
        return call

    @staticmethod
    @transaction.atomic
    def join_media(*, call_id, user: User) -> dict[str, object]:
        call = _get_call_for_user(call_id=call_id, user=user)
        if not settings.LIVEKIT_URL:
            raise CallServiceError(
                code="media_not_configured",
                message="LiveKit is not configured on the backend.",
                status_code=500,
            )
        if call.state not in {
            CallState.ACCEPTED,
            CallState.CONNECTING,
            CallState.CONNECTED,
        }:
            raise CallServiceError(
                code="invalid_call_state",
                message="Media is not available for this call yet.",
                status_code=409,
            )

        now = timezone.now()
        if call.state == CallState.ACCEPTED:
            call.state = CallState.CONNECTING
            call.save(update_fields=["state", "updated_at"])

        _record_event(call=call, event_type="call.join_media", actor_user=user)

        joined_count = (
            CallEvent.objects.filter(call=call, event_type="call.join_media")
            .exclude(actor_user__isnull=True)
            .values("actor_user")
            .distinct()
            .count()
        )
        if joined_count >= 2 and call.state != CallState.CONNECTED:
            call.state = CallState.CONNECTED
            call.connected_at = now
            call.save(update_fields=["state", "connected_at", "updated_at"])

        participant_identity = f"participant_{user.id.hex}_{call.id.hex}"
        token = (
            AccessToken()
            .with_identity(participant_identity)
            .with_name(user.display_name or user.phone_number_normalized)
            .with_grants(
                VideoGrants(
                    room_join=True,
                    room=call.room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=False,
                )
            )
            .with_ttl(timedelta(minutes=settings.LIVEKIT_TOKEN_TTL_MINUTES))
            .to_jwt()
        )

        transaction.on_commit(
            lambda: _emit_call_payload(call=call, event_type="call.updated")
        )
        return {
            "provider": call.provider,
            "server_url": settings.LIVEKIT_URL,
            "participant_token": token,
            "expires_at": now + timedelta(minutes=settings.LIVEKIT_TOKEN_TTL_MINUTES),
            "call": call,
        }
