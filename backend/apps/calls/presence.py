from __future__ import annotations

from apps.contacts.models import Contact, ContactStatus
from channels.db import database_sync_to_async

from .realtime import broadcast_user_event_async


@database_sync_to_async
def _get_presence_subscriber_ids(user) -> list[str]:
    return [
        str(owner_id)
        for owner_id in Contact.objects.filter(
            contact_user=user,
            status=ContactStatus.ACCEPTED,
        ).values_list("owner_id", flat=True)
    ]


async def broadcast_presence_change(*, user, event_type: str) -> None:
    subscriber_ids = await _get_presence_subscriber_ids(user)
    payload = {
        "user_id": str(user.id),
        "display_name": user.display_name,
        "phone_number_normalized": user.phone_number_normalized,
    }
    for subscriber_id in subscriber_ids:
        await broadcast_user_event_async(
            user_id=subscriber_id,
            event_type=event_type,
            payload=payload,
        )
