import uuid

from apps.accounts.models import DeviceSession, User
from apps.devices.models import Device, DevicePlatform, PushProvider
from django.contrib.auth import authenticate
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthAPITests(APITestCase):
    @override_settings(PHONENUMBER_DEFAULT_REGION="BD")
    def test_create_superuser_accepts_username_field_value(self):
        user = User.objects.create_superuser(
            phone_number_normalized="01726540494",
            email="admin@example.com",
            password="StrongPass123!",
            display_name="Admin User",
        )

        self.assertEqual(user.phone_number, "01726540494")
        self.assertEqual(user.phone_number_normalized, "+8801726540494")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)

    @override_settings(PHONENUMBER_DEFAULT_REGION="BD")
    def test_authenticate_accepts_local_phone_input(self):
        user = User.objects.create_superuser(
            phone_number_normalized="01726540494",
            email="admin@example.com",
            password="StrongPass123!",
            display_name="Admin User",
        )

        authenticated_user = authenticate(
            username="01726540494",
            password="StrongPass123!",
        )

        self.assertEqual(authenticated_user, user)

    def test_register_creates_user_with_normalized_fields(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "phone_number": "+1 415 555 2671",
                "email": "USER@Example.COM",
                "password": "StrongPass123!",
                "display_name": "Test User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)

        user = User.objects.get()
        self.assertEqual(user.phone_number_normalized, "+14155552671")
        self.assertEqual(user.email, "USER@example.com".lower())

    def test_login_refresh_and_logout_use_device_session(self):
        user = User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="user@example.com",
            password="StrongPass123!",
            display_name="Auth User",
        )
        installation_id = str(uuid.uuid4())

        login_response = self.client.post(
            reverse("auth-login"),
            {
                "installation_id": installation_id,
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
                "device_label": "Pixel Test",
            },
            format="json",
        )

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", login_response.data)
        self.assertIn("device_session_token", login_response.data)
        self.assertEqual(
            DeviceSession.objects.filter(user=user, revoked_at__isnull=True).count(), 1
        )
        self.assertEqual(
            str(DeviceSession.objects.get(user=user).installation_id),
            installation_id,
        )

        refresh_response = self.client.post(
            reverse("auth-refresh"),
            {"device_session_token": login_response.data["device_session_token"]},
            format="json",
        )

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", refresh_response.data)
        self.assertNotEqual(
            refresh_response.data["device_session_token"],
            login_response.data["device_session_token"],
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh_response.data['access_token']}"
        )
        logout_response = self.client.post(
            reverse("auth-logout"),
            {"device_session_token": refresh_response.data["device_session_token"]},
            format="json",
        )

        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            DeviceSession.objects.filter(user=user, revoked_at__isnull=False).exists()
        )

        refresh_after_logout = self.client.post(
            reverse("auth-refresh"),
            {"device_session_token": refresh_response.data["device_session_token"]},
            format="json",
        )
        self.assertEqual(refresh_after_logout.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_revokes_only_the_current_device_session(self):
        user = User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="user@example.com",
            password="StrongPass123!",
            display_name="Auth User",
        )
        first_installation_id = str(uuid.uuid4())
        second_installation_id = str(uuid.uuid4())

        first_login_response = self.client.post(
            reverse("auth-login"),
            {
                "installation_id": first_installation_id,
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
                "device_label": "Pixel 8",
            },
            format="json",
        )
        second_login_response = self.client.post(
            reverse("auth-login"),
            {
                "installation_id": second_installation_id,
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
                "device_label": "Pixel Tablet",
            },
            format="json",
        )

        self.assertEqual(first_login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            DeviceSession.objects.filter(user=user, revoked_at__isnull=True).count(), 2
        )

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {first_login_response.data['access_token']}"
        )
        logout_response = self.client.post(
            reverse("auth-logout"),
            {"device_session_token": first_login_response.data["device_session_token"]},
            format="json",
        )

        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            DeviceSession.objects.filter(user=user, revoked_at__isnull=True).count(), 1
        )

        second_refresh_response = self.client.post(
            reverse("auth-refresh"),
            {
                "device_session_token": second_login_response.data[
                    "device_session_token"
                ]
            },
            format="json",
        )

        self.assertEqual(second_refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", second_refresh_response.data)

    def test_logout_invalidates_active_device_for_same_installation(self):
        user = User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="user@example.com",
            password="StrongPass123!",
            display_name="Auth User",
        )
        installation_id = str(uuid.uuid4())

        login_response = self.client.post(
            reverse("auth-login"),
            {
                "installation_id": installation_id,
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
                "device_label": "Pixel 8",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access_token']}"
        )
        register_response = self.client.post(
            reverse("devices-register"),
            {
                "platform": DevicePlatform.ANDROID,
                "push_provider": PushProvider.FCM,
                "installation_id": installation_id,
                "push_token": "fcm-token-1",
                "app_version": "1.0.0",
                "device_label": "Pixel 8",
            },
            format="json",
        )
        self.assertEqual(register_response.status_code, status.HTTP_200_OK)
        device = Device.objects.get(user=user, installation_id=installation_id)
        self.assertTrue(device.is_active)

        logout_response = self.client.post(
            reverse("auth-logout"),
            {"device_session_token": login_response.data["device_session_token"]},
            format="json",
        )

        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        device.refresh_from_db()
        self.assertFalse(device.is_active)
        self.assertIsNotNone(device.invalidated_at)

    def test_logout_invalidates_device_linked_to_session_without_installation_id(self):
        user = User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="user@example.com",
            password="StrongPass123!",
            display_name="Auth User",
        )

        session, raw_token = DeviceSession.create_with_token(
            user=user,
            installation_id=None,
            device_label="Legacy install",
        )
        device = Device.objects.create(
            user=user,
            device_session=session,
            platform=DevicePlatform.ANDROID,
            push_provider=PushProvider.FCM,
            installation_id=uuid.uuid4(),
            push_token="legacy-token",
            app_version="1.0.0",
            device_label="Legacy Pixel",
        )

        self.client.force_authenticate(user=user)
        logout_response = self.client.post(
            reverse("auth-logout"),
            {"device_session_token": raw_token},
            format="json",
        )

        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        device.refresh_from_db()
        self.assertFalse(device.is_active)
        self.assertIsNotNone(device.invalidated_at)

    def test_refresh_rejects_revoked_device_session(self):
        user = User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="user@example.com",
            password="StrongPass123!",
            display_name="Auth User",
        )

        login_response = self.client.post(
            reverse("auth-login"),
            {
                "installation_id": str(uuid.uuid4()),
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
                "device_label": "Pixel 8",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        session = DeviceSession.objects.get(user=user, revoked_at__isnull=True)
        session.revoke("server-side-test")

        refresh_response = self.client.post(
            reverse("auth-refresh"),
            {"device_session_token": login_response.data["device_session_token"]},
            format="json",
        )

        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(refresh_response.data["code"], "invalid_device_session")

    def test_me_returns_current_user_for_valid_access_token(self):
        User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="viewer@example.com",
            password="StrongPass123!",
            display_name="Viewer",
        )

        login_response = self.client.post(
            reverse("auth-login"),
            {
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access_token']}"
        )
        me_response = self.client.get(reverse("users-me"), format="json")

        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["display_name"], "Viewer")
        self.assertEqual(me_response.data["phone_number_normalized"], "+14155552671")

    def test_patch_me_updates_profile_fields(self):
        User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="viewer@example.com",
            password="StrongPass123!",
            display_name="Viewer",
        )

        login_response = self.client.post(
            reverse("auth-login"),
            {
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access_token']}"
        )
        patch_response = self.client.patch(
            reverse("users-me"),
            {
                "display_name": "Updated Viewer",
                "first_name": "Updated",
                "last_name": "User",
                "email": "UPDATED@Example.com",
            },
            format="json",
        )

        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["display_name"], "Updated Viewer")
        self.assertEqual(patch_response.data["first_name"], "Updated")
        self.assertEqual(patch_response.data["last_name"], "User")
        self.assertEqual(patch_response.data["email"], "updated@example.com")

    def test_patch_me_rejects_duplicate_email(self):
        User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="viewer@example.com",
            password="StrongPass123!",
            display_name="Viewer",
        )
        User.objects.create_user(
            phone_number="+1 415 555 2672",
            email="other@example.com",
            password="StrongPass123!",
            display_name="Other",
        )

        login_response = self.client.post(
            reverse("auth-login"),
            {
                "phone_number": "+1 415 555 2671",
                "password": "StrongPass123!",
            },
            format="json",
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access_token']}"
        )
        patch_response = self.client.patch(
            reverse("users-me"),
            {
                "email": "other@example.com",
            },
            format="json",
        )

        self.assertEqual(patch_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(patch_response.data["code"], "profile_update_failed")
