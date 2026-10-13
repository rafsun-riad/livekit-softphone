from apps.accounts.models import User
from apps.contacts.models import Contact, ContactStatus
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    Conversation,
    ConversationKind,
    ConversationParticipantState,
    Message,
    MessageReceipt,
    MessageType,
    ReceiptStatus,
)


class MessagingModelTests(TestCase):
    def test_can_create_direct_conversation_and_encrypted_message(self):
        sender = User.objects.create_user(
            phone_number="+1 415 555 8101",
            email="sender@example.com",
            password="StrongPass123!",
            display_name="Sender User",
        )
        recipient = User.objects.create_user(
            phone_number="+1 415 555 8102",
            email="recipient@example.com",
            password="StrongPass123!",
            display_name="Recipient User",
        )

        conversation = Conversation.objects.create(
            kind=ConversationKind.DIRECT,
            created_by=sender,
        )
        ConversationParticipantState.objects.create(
            conversation=conversation,
            user=sender,
        )
        ConversationParticipantState.objects.create(
            conversation=conversation,
            user=recipient,
        )
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            message_type=MessageType.TEXT,
            client_message_id="message-001",
            ciphertext={"body": "ciphertext"},
        )
        receipt = MessageReceipt.objects.create(
            message=message,
            user=recipient,
            status=ReceiptStatus.DELIVERED,
        )

        self.assertEqual(conversation.kind, ConversationKind.DIRECT)
        self.assertEqual(conversation.participants.count(), 2)
        self.assertEqual(message.ciphertext["body"], "ciphertext")
        self.assertEqual(receipt.status, ReceiptStatus.DELIVERED)


class MessagingAPITests(APITestCase):
    def setUp(self):
        super().setUp()
        self.sender = User.objects.create_user(
            phone_number="+1 415 555 8201",
            email="sender-api@example.com",
            password="StrongPass123!",
            display_name="Sender API",
        )
        self.recipient = User.objects.create_user(
            phone_number="+1 415 555 8202",
            email="recipient-api@example.com",
            password="StrongPass123!",
            display_name="Recipient API",
        )
        self.outsider = User.objects.create_user(
            phone_number="+1 415 555 8203",
            email="outsider-api@example.com",
            password="StrongPass123!",
            display_name="Outsider API",
        )
        Contact.objects.create(
            owner=self.sender,
            contact_user=self.recipient,
            status=ContactStatus.ACCEPTED,
        )

    def authenticate(self, user: User):
        self.client.force_authenticate(user=user)

    def test_direct_conversation_bootstrap_reuses_existing_conversation(self):
        self.authenticate(self.sender)

        create_response = self.client.post(
            reverse("messaging-conversations-direct"),
            {"target_user_id": str(self.recipient.id)},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["kind"], ConversationKind.DIRECT)
        self.assertEqual(len(create_response.data["participants"]), 2)

        second_response = self.client.post(
            reverse("messaging-conversations-direct"),
            {"target_user_id": str(self.recipient.id)},
            format="json",
        )

        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.data["id"], create_response.data["id"])

    def test_direct_conversation_bootstrap_rejects_non_contact(self):
        self.authenticate(self.sender)

        response = self.client.post(
            reverse("messaging-conversations-direct"),
            {"target_user_id": str(self.outsider.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["code"], "conversation_create_failed")

    def test_participants_can_create_and_list_messages(self):
        conversation = Conversation.objects.create(
            kind=ConversationKind.DIRECT,
            created_by=self.sender,
        )
        ConversationParticipantState.objects.create(
            conversation=conversation,
            user=self.sender,
        )
        ConversationParticipantState.objects.create(
            conversation=conversation,
            user=self.recipient,
        )

        self.authenticate(self.sender)
        create_message_response = self.client.post(
            reverse("messaging-messages", args=[conversation.id]),
            {
                "message_type": MessageType.TEXT,
                "ciphertext": {"body": "opaque-ciphertext"},
                "client_message_id": "thread-message-001",
            },
            format="json",
        )

        self.assertEqual(create_message_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_message_response.data["message_type"], MessageType.TEXT)
        self.assertEqual(
            create_message_response.data["ciphertext"]["body"],
            "opaque-ciphertext",
        )

        conversation.refresh_from_db()
        self.assertIsNotNone(conversation.latest_message_at)

        self.authenticate(self.recipient)
        list_response = self.client.get(
            reverse("messaging-messages", args=[conversation.id]),
            format="json",
        )

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(
            list_response.data[0]["client_message_id"], "thread-message-001"
        )

        detail_response = self.client.get(
            reverse("messaging-conversations-detail", args=[conversation.id]),
            format="json",
        )
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            detail_response.data["latest_message"]["message_type"], MessageType.TEXT
        )

        self.authenticate(self.outsider)
        outsider_response = self.client.get(
            reverse("messaging-messages", args=[conversation.id]),
            format="json",
        )
        self.assertEqual(outsider_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(outsider_response.data["code"], "conversation_not_found")
