from unittest.mock import AsyncMock, patch

from apps.accounts.models import User
from apps.contacts.models import Contact, ContactStatus
from asgiref.sync import async_to_sync
from django.test import TestCase

from .presence import broadcast_presence_change


class PresenceTests(TestCase):
    def test_broadcast_presence_change_awaits_async_realtime_sender(self):
        user = User.objects.create_user(
            phone_number="+1 415 555 6001",
            email="callee@example.com",
            password="StrongPass123!",
            display_name="Callee User",
        )
        subscriber = User.objects.create_user(
            phone_number="+1 415 555 6002",
            email="caller@example.com",
            password="StrongPass123!",
            display_name="Caller User",
        )
        Contact.objects.create(
            owner=subscriber,
            contact_user=user,
            status=ContactStatus.ACCEPTED,
        )

        with patch(
            "apps.calls.presence.broadcast_user_event_async",
            new_callable=AsyncMock,
        ) as broadcast_mock:
            async_to_sync(broadcast_presence_change)(
                user=user,
                event_type="presence.user_online",
            )

        broadcast_mock.assert_awaited_once_with(
            user_id=str(subscriber.id),
            event_type="presence.user_online",
            payload={
                "user_id": str(user.id),
                "display_name": user.display_name,
                "phone_number_normalized": user.phone_number_normalized,
            },
        )
