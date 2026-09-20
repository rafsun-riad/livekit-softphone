from unittest.mock import AsyncMock, MagicMock, patch

from apps.accounts.models import User
from apps.contacts.models import Contact, ContactStatus
from asgiref.sync import async_to_sync
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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
        with (
            patch(
                "apps.calls.presence._get_presence_subscriber_ids",
                new_callable=AsyncMock,
                return_value=[str(subscriber.id)],
            ) as subscriber_ids_mock,
            patch(
                "apps.calls.presence.broadcast_user_event_async",
                new_callable=AsyncMock,
            ) as broadcast_mock,
        ):
            async_to_sync(broadcast_presence_change)(
                user=user,
                event_type="presence.user_online",
            )

        subscriber_ids_mock.assert_awaited_once_with(user)
        broadcast_mock.assert_awaited_once_with(
            user_id=str(subscriber.id),
            event_type="presence.user_online",
            payload={
                "user_id": str(user.id),
                "display_name": user.display_name,
                "phone_number_normalized": user.phone_number_normalized,
            },
        )


@override_settings(LIVEKIT_URL="ws://202.51.182.173")
class CallAPITests(APITestCase):
    def setUp(self):
        super().setUp()
        self.caller = User.objects.create_user(
            phone_number="+1 415 555 7001",
            email="caller@example.com",
            password="StrongPass123!",
            display_name="Caller User",
        )
        self.callee = User.objects.create_user(
            phone_number="+1 415 555 7002",
            email="callee@example.com",
            password="StrongPass123!",
            display_name="Callee User",
        )
        self.outsider = User.objects.create_user(
            phone_number="+1 415 555 7003",
            email="outsider@example.com",
            password="StrongPass123!",
            display_name="Outsider User",
        )
        Contact.objects.create(
            owner=self.caller,
            contact_user=self.callee,
            status=ContactStatus.ACCEPTED,
        )

    def authenticate(self, user: User):
        self.client.force_authenticate(user=user)

    def create_livekit_token_builder(self):
        builder = MagicMock()
        builder.with_identity.return_value = builder
        builder.with_name.return_value = builder
        builder.with_grants.return_value = builder
        builder.with_ttl.return_value = builder
        builder.to_jwt.return_value = "participant-token"
        return builder

    @patch("apps.calls.services.send_incoming_call_push")
    @patch("apps.calls.services.broadcast_user_event")
    def test_create_accept_join_and_end_call_flow(
        self,
        broadcast_mock,
        push_mock,
    ):
        self.authenticate(self.caller)
        create_response = self.client.post(
            reverse("calls-create"),
            {
                "recipient_user_id": str(self.callee.id),
                "call_type": "video",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["state"], "ringing")
        self.assertEqual(create_response.data["call_type"], "video")
        call_id = create_response.data["id"]

        self.authenticate(self.callee)
        accept_response = self.client.post(
            reverse("calls-accept", args=[call_id]),
            format="json",
        )

        self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_response.data["state"], "accepted")

        with patch(
            "apps.calls.services.AccessToken",
            return_value=self.create_livekit_token_builder(),
        ):
            join_callee_response = self.client.post(
                reverse("calls-join-media", args=[call_id]),
                format="json",
            )

        self.assertEqual(join_callee_response.status_code, status.HTTP_200_OK)
        self.assertEqual(join_callee_response.data["call"]["state"], "connecting")
        self.assertEqual(
            join_callee_response.data["participant_token"],
            "participant-token",
        )

        self.authenticate(self.caller)
        with patch(
            "apps.calls.services.AccessToken",
            return_value=self.create_livekit_token_builder(),
        ):
            join_caller_response = self.client.post(
                reverse("calls-join-media", args=[call_id]),
                format="json",
            )

        self.assertEqual(join_caller_response.status_code, status.HTTP_200_OK)
        self.assertEqual(join_caller_response.data["call"]["state"], "connected")

        end_response = self.client.post(
            reverse("calls-end", args=[call_id]),
            format="json",
        )
        self.assertEqual(end_response.status_code, status.HTTP_200_OK)
        self.assertEqual(end_response.data["state"], "ended")

    @patch("apps.calls.services.send_incoming_call_push")
    @patch("apps.calls.services.broadcast_user_event")
    def test_callee_can_reject_ringing_call(self, _broadcast_mock, _push_mock):
        self.authenticate(self.caller)
        create_response = self.client.post(
            reverse("calls-create"),
            {
                "recipient_user_id": str(self.callee.id),
                "call_type": "audio",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        self.authenticate(self.callee)
        reject_response = self.client.post(
            reverse("calls-reject", args=[create_response.data["id"]]),
            format="json",
        )

        self.assertEqual(reject_response.status_code, status.HTTP_200_OK)
        self.assertEqual(reject_response.data["state"], "rejected")

    @patch("apps.calls.services.send_incoming_call_push")
    @patch("apps.calls.services.broadcast_user_event")
    def test_caller_can_cancel_ringing_call(self, _broadcast_mock, _push_mock):
        self.authenticate(self.caller)
        create_response = self.client.post(
            reverse("calls-create"),
            {
                "recipient_user_id": str(self.callee.id),
                "call_type": "audio",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        cancel_response = self.client.post(
            reverse("calls-cancel", args=[create_response.data["id"]]),
            format="json",
        )

        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_response.data["state"], "cancelled")

    def test_create_call_rejects_non_contact_recipient(self):
        self.authenticate(self.caller)

        response = self.client.post(
            reverse("calls-create"),
            {
                "recipient_user_id": str(self.outsider.id),
                "call_type": "audio",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["code"], "call_not_allowed")

    @patch("apps.calls.services.send_incoming_call_push")
    @patch("apps.calls.services.broadcast_user_event")
    def test_join_media_requires_call_participation(
        self,
        _broadcast_mock,
        _push_mock,
    ):
        self.authenticate(self.caller)
        create_response = self.client.post(
            reverse("calls-create"),
            {
                "recipient_user_id": str(self.callee.id),
                "call_type": "audio",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        self.authenticate(self.outsider)
        with patch(
            "apps.calls.services.AccessToken",
            return_value=self.create_livekit_token_builder(),
        ):
            join_response = self.client.post(
                reverse("calls-join-media", args=[create_response.data["id"]]),
                format="json",
            )

        self.assertEqual(join_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(join_response.data["code"], "call_not_found")
