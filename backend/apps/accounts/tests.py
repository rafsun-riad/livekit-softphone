from apps.accounts.models import DeviceSession, User
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

        login_response = self.client.post(
            reverse("auth-login"),
            {
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
