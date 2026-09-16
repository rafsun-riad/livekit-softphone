from io import StringIO
from types import SimpleNamespace
from unittest.mock import patch

from apps.accounts.models import User
from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Device, DevicePlatform, PushProvider
from .services import (
    DevicePushService,
    PushSendResult,
    build_firebase_service_account_info,
)


class DeviceAPITests(APITestCase):
    def setUp(self):
        super().setUp()
        self.user = User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="owner@example.com",
            password="StrongPass123!",
            display_name="Owner User",
        )
        self.other_user = User.objects.create_user(
            phone_number="+1 415 555 2672",
            email="other@example.com",
            password="StrongPass123!",
            display_name="Other User",
        )
        self.client.force_authenticate(user=self.user)

    def test_register_device_creates_or_updates_active_device(self):
        register_response = self.client.post(
            reverse("devices-register"),
            {
                "platform": DevicePlatform.ANDROID,
                "push_provider": PushProvider.FCM,
                "push_token": "fcm-token-1",
                "app_version": "1.0.0",
                "device_label": "Pixel 8",
            },
            format="json",
        )

        self.assertEqual(register_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Device.objects.count(), 1)
        device = Device.objects.get()
        self.assertEqual(device.device_label, "Pixel 8")
        self.assertTrue(device.is_active)

        update_response = self.client.post(
            reverse("devices-register"),
            {
                "platform": DevicePlatform.ANDROID,
                "push_token": "fcm-token-1",
                "app_version": "1.0.1",
                "device_label": "Pixel 8 Pro",
            },
            format="json",
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Device.objects.count(), 1)
        device.refresh_from_db()
        self.assertEqual(device.app_version, "1.0.1")
        self.assertEqual(device.device_label, "Pixel 8 Pro")
        self.assertEqual(device.push_provider, PushProvider.FCM)

    def test_delete_device_invalidates_only_owned_device(self):
        device = Device.objects.create(
            user=self.user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-1",
            app_version="1.0.0",
            device_label="Pixel 8",
        )
        other_device = Device.objects.create(
            user=self.other_user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-2",
            app_version="1.0.0",
            device_label="Other Phone",
        )

        delete_response = self.client.delete(
            reverse("devices-detail", args=[str(device.id)])
        )

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        device.refresh_from_db()
        other_device.refresh_from_db()
        self.assertFalse(device.is_active)
        self.assertIsNotNone(device.invalidated_at)
        self.assertTrue(other_device.is_active)

    def test_list_devices_returns_only_current_user_devices(self):
        owned_device = Device.objects.create(
            user=self.user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="owned-token",
            app_version="1.0.0",
            device_label="Pixel 8",
        )
        Device.objects.create(
            user=self.other_user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="other-token",
            app_version="1.0.0",
            device_label="Other Phone",
        )

        list_response = self.client.get(reverse("devices-list"))

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["id"], str(owned_device.id))

    def test_delete_device_returns_not_found_for_non_owned_device(self):
        other_device = Device.objects.create(
            user=self.other_user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-2",
            app_version="1.0.0",
            device_label="Other Phone",
        )

        delete_response = self.client.delete(
            reverse("devices-detail", args=[str(other_device.id)])
        )

        self.assertEqual(delete_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(delete_response.data["code"], "device_not_found")

    @patch(
        "apps.devices.management.commands.send_test_push.DevicePushService.send_to_devices"
    )
    def test_send_test_push_management_command_uses_registered_device(self, send_mock):
        device = Device.objects.create(
            user=self.user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-1",
            app_version="1.0.0",
            device_label="Pixel 8",
        )
        send_mock.return_value = PushSendResult(
            success_count=1,
            failure_count=0,
            successful_tokens=["fcm-token-1"],
            failed_tokens=[],
            message_ids=["message-1"],
        )

        stdout = StringIO()
        call_command(
            "send_test_push",
            str(device.id),
            "--title=Incoming Call",
            "--body=Tap to answer",
            "--data=call_id=abc123",
            "--dry-run",
            stdout=stdout,
        )

        send_mock.assert_called_once()
        self.assertIn(f"Target device: {device.id}", stdout.getvalue())
        self.assertIn("successes=1 failures=0", stdout.getvalue())

    @patch(
        "apps.devices.management.commands.send_test_push.DevicePushService.send_to_devices"
    )
    def test_send_test_push_management_command_can_target_latest_device(
        self, send_mock
    ):
        older_device = Device.objects.create(
            user=self.user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-older",
            app_version="1.0.0",
            device_label="Older Phone",
        )
        latest_device = Device.objects.create(
            user=self.other_user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-latest",
            app_version="1.0.1",
            device_label="Latest Phone",
        )
        send_mock.return_value = PushSendResult(
            success_count=1,
            failure_count=0,
            successful_tokens=["fcm-token-latest"],
            failed_tokens=[],
            message_ids=["message-2"],
        )

        Device.objects.filter(id=older_device.id).update(
            last_seen_at=older_device.created_at
        )

        stdout = StringIO()
        call_command("send_test_push", "--latest", stdout=stdout)

        send_mock.assert_called_once_with(
            devices=[latest_device],
            title="LiveKit Softphone test push",
            body="This is a test push notification from the backend.",
            data={},
            dry_run=False,
        )
        self.assertIn(f"Target device: {latest_device.id}", stdout.getvalue())

    def test_list_devices_management_command_lists_registered_devices(self):
        active_device = Device.objects.create(
            user=self.user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-1",
            app_version="1.0.0",
            device_label="Pixel 8",
        )
        inactive_device = Device.objects.create(
            user=self.user,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            push_token="fcm-token-2",
            app_version="1.0.0",
            device_label="Old Pixel",
            is_active=False,
        )

        stdout = StringIO()
        call_command("list_devices", stdout=stdout)
        output = stdout.getvalue()

        self.assertIn(str(active_device.id), output)
        self.assertNotIn(str(inactive_device.id), output)


class DevicePushServiceTests(SimpleTestCase):
    @override_settings(FCM_PROJECT_ID="", FCM_CLIENT_EMAIL="", FCM_PRIVATE_KEY="")
    def test_build_firebase_service_account_info_requires_configuration(self):
        with self.assertRaises(ImproperlyConfigured):
            build_firebase_service_account_info()

    @override_settings(
        FCM_ENABLED=True,
        FCM_PROJECT_ID="livekit-softphone-mruhaq-6b385",
        FCM_CLIENT_EMAIL="firebase-adminsdk@test-project.iam.gserviceaccount.com",
        FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
    )
    @patch("apps.devices.services.messaging")
    @patch("apps.devices.services.credentials")
    @patch("apps.devices.services.firebase_admin")
    def test_send_to_devices_uses_firebase_multicast_and_filters_tokens(
        self,
        firebase_admin_mock,
        credentials_mock,
        messaging_mock,
    ):
        notification = object()
        message = object()
        app = object()

        firebase_admin_mock.get_app.side_effect = ValueError("missing app")
        firebase_admin_mock.initialize_app.return_value = app
        credentials_mock.Certificate.return_value = object()
        messaging_mock.Notification.return_value = notification
        messaging_mock.MulticastMessage.return_value = message
        messaging_mock.send_each_for_multicast.return_value = SimpleNamespace(
            success_count=1,
            failure_count=1,
            responses=[
                SimpleNamespace(success=True, message_id="msg-1"),
                SimpleNamespace(success=False, message_id=None),
            ],
        )

        devices = [
            SimpleNamespace(
                push_token="token-1",
                push_provider=PushProvider.FCM,
                is_active=True,
            ),
            SimpleNamespace(
                push_token="token-2",
                push_provider=PushProvider.FCM,
                is_active=True,
            ),
            SimpleNamespace(
                push_token="token-3",
                push_provider=PushProvider.FCM,
                is_active=False,
            ),
        ]

        result = DevicePushService.send_to_devices(
            devices=devices,
            title="Incoming call",
            body="Tap to answer",
            data={"call_id": "abc123"},
            dry_run=True,
        )

        credentials_mock.Certificate.assert_called_once_with(
            {
                "type": "service_account",
                "project_id": "livekit-softphone-mruhaq-6b385",
                "client_email": "firebase-adminsdk@test-project.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
        messaging_mock.MulticastMessage.assert_called_once_with(
            tokens=["token-1", "token-2"],
            data={"call_id": "abc123"},
            notification=notification,
        )
        messaging_mock.send_each_for_multicast.assert_called_once_with(
            message,
            dry_run=True,
            app=app,
        )
        self.assertEqual(result.success_count, 1)
        self.assertEqual(result.failure_count, 1)
        self.assertEqual(result.successful_tokens, ["token-1"])
        self.assertEqual(result.failed_tokens, ["token-2"])
        self.assertEqual(result.message_ids, ["msg-1"])

    @override_settings(FCM_ENABLED=True)
    def test_send_to_devices_returns_empty_result_without_eligible_tokens(self):
        result = DevicePushService.send_to_devices(devices=[])

        self.assertEqual(result.success_count, 0)
        self.assertEqual(result.failure_count, 0)
        self.assertEqual(result.successful_tokens, [])
        self.assertEqual(result.failed_tokens, [])
        self.assertEqual(result.message_ids, [])
