from apps.accounts.models import User
from apps.contacts.models import Contact, ContactStatus
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class ContactAPITests(APITestCase):
    def setUp(self):
        super().setUp()
        self.owner = User.objects.create_user(
            phone_number="+1 415 555 2671",
            email="owner@example.com",
            password="StrongPass123!",
            display_name="Owner User",
        )
        self.contact_user = User.objects.create_user(
            phone_number="+1 415 555 2672",
            email="friend@example.com",
            password="StrongPass123!",
            display_name="Alice Friend",
        )
        self.other_user = User.objects.create_user(
            phone_number="+1 415 555 2673",
            email="other@example.com",
            password="StrongPass123!",
            display_name="Bob Other",
        )
        self.client.force_authenticate(user=self.owner)

    def test_user_search_returns_matching_users_and_excludes_self(self):
        response = self.client.get(reverse("users-search"), {"q": "Alice"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(self.contact_user.id))
        self.assertNotIn("email", response.data[0])

        phone_response = self.client.get(reverse("users-search"), {"q": "2673"})
        self.assertEqual(phone_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(phone_response.data), 1)
        self.assertEqual(phone_response.data[0]["id"], str(self.other_user.id))

    def test_contact_create_list_and_delete_flow(self):
        create_response = self.client.post(
            reverse("contacts-list-create"),
            {"target_user_id": str(self.contact_user.id)},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.count(), 1)
        self.assertEqual(
            Contact.objects.get().status,
            ContactStatus.ACCEPTED,
        )

        list_response = self.client.get(reverse("contacts-list-create"))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(
            list_response.data[0]["contact_user"]["id"],
            str(self.contact_user.id),
        )

        delete_response = self.client.delete(
            reverse("contacts-detail", args=[str(create_response.data["id"])]),
        )
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Contact.objects.exists())

    def test_contact_create_rejects_duplicates_and_self(self):
        Contact.objects.create(
            owner=self.owner,
            contact_user=self.contact_user,
            status=ContactStatus.ACCEPTED,
        )

        duplicate_response = self.client.post(
            reverse("contacts-list-create"),
            {"target_user_id": str(self.contact_user.id)},
            format="json",
        )
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(duplicate_response.data["code"], "contact_create_failed")

        self_response = self.client.post(
            reverse("contacts-list-create"),
            {"target_user_id": str(self.owner.id)},
            format="json",
        )
        self.assertEqual(self_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self_response.data["code"], "contact_create_failed")
