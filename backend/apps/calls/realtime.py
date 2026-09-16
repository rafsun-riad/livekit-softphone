from __future__ import annotations

from apps.devices.services import DevicePushService
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def user_group_name(user_id) -> str:
    return f"user_{user_id}"


def broadcast_user_event(*, user_id, event_type: str, payload: dict) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    async_to_sync(channel_layer.group_send)(
        user_group_name(user_id),
        {
            "type": "dispatch.event",
            "event_type": event_type,
            "payload": payload,
        },
    )


def send_incoming_call_push(*, user, payload: dict, caller_name: str) -> None:
    DevicePushService.send_to_user_devices(
        user=user,
        title="Incoming call",
        body=f"{caller_name} is calling you.",
        data={
            "event_type": "call.incoming",
            **{key: str(value) for key, value in payload.items()},
        },
        dry_run=False,
    )
