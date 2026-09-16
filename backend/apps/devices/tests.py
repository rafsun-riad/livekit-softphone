from apps.accounts.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Device, DevicePlatform, PushProvider


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
