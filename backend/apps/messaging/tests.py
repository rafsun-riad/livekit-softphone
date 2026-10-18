from unittest.mock import patch

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

    def test_direct_conversation_bootstrap_allows_non_contact(self):
        self.authenticate(self.sender)

        response = self.client.post(
            reverse("messaging-conversations-direct"),
            {"target_user_id": str(self.outsider.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["kind"], ConversationKind.DIRECT)

    @patch("apps.messaging.services.broadcast_user_event")
    def test_participants_can_create_and_list_messages(self, broadcast_mock):
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
        with self.captureOnCommitCallbacks(execute=True):
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

        event_calls = [call.kwargs for call in broadcast_mock.call_args_list]
        incoming_calls = [
            call for call in event_calls if call["event_type"] == "message.incoming"
        ]
        conversation_calls = [
            call for call in event_calls if call["event_type"] == "conversation.updated"
        ]

        self.assertEqual(len(incoming_calls), 1)
        self.assertEqual(incoming_calls[0]["user_id"], self.recipient.id)
        self.assertEqual(
            incoming_calls[0]["payload"]["conversation_id"],
            str(conversation.id),
        )
        self.assertEqual(
            incoming_calls[0]["payload"]["message"]["id"],
            create_message_response.data["id"],
        )

        self.assertEqual(len(conversation_calls), 2)
        self.assertSetEqual(
            {call["user_id"] for call in conversation_calls},
            {self.sender.id, self.recipient.id},
        )
        self.assertTrue(
            all(
                call["payload"]["id"] == str(conversation.id)
                for call in conversation_calls
            )
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

    def test_blocked_users_cannot_bootstrap_or_send_messages(self):
        Contact.objects.create(
            owner=self.sender,
            contact_user=self.outsider,
            status=ContactStatus.BLOCKED,
        )

        self.authenticate(self.sender)
        bootstrap_response = self.client.post(
            reverse("messaging-conversations-direct"),
            {"target_user_id": str(self.outsider.id)},
            format="json",
        )

        self.assertEqual(bootstrap_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(bootstrap_response.data["code"], "conversation_blocked")

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
            user=self.outsider,
        )

        create_message_response = self.client.post(
            reverse("messaging-messages", args=[conversation.id]),
            {
                "message_type": MessageType.TEXT,
                "ciphertext": {"body": "should fail"},
                "client_message_id": "blocked-message-001",
            },
            format="json",
        )
        self.assertEqual(create_message_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(create_message_response.data["code"], "conversation_blocked")

    @patch("apps.messaging.services.broadcast_user_event")
    def test_participant_can_mark_messages_read_and_emit_receipt_event(
        self,
        broadcast_mock,
    ):
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
        message = Message.objects.create(
            conversation=conversation,
            sender=self.sender,
            message_type=MessageType.TEXT,
            client_message_id="receipt-message-001",
            ciphertext={"body": "ciphertext"},
        )

        self.authenticate(self.recipient)
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                reverse("messaging-read-receipts", args=[conversation.id]),
                {"message_id": str(message.id)},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated_count"], 1)

        receipt = MessageReceipt.objects.filter(
            message=message, user=self.recipient
        ).first()
        self.assertIsNotNone(receipt)
        self.assertEqual(receipt.status, ReceiptStatus.READ)

        participant_state = ConversationParticipantState.objects.get(
            conversation=conversation,
            user=self.recipient,
        )
        self.assertEqual(participant_state.last_read_message_id, message.id)
        self.assertIsNotNone(participant_state.last_read_at)

        receipt_event_calls = [
            call.kwargs
            for call in broadcast_mock.call_args_list
            if call.kwargs["event_type"] == "message.receipt"
        ]
        self.assertEqual(len(receipt_event_calls), 2)
        self.assertSetEqual(
            {call["user_id"] for call in receipt_event_calls},
            {self.sender.id, self.recipient.id},
        )
        self.assertTrue(
            all(
                call["payload"]["conversation_id"] == str(conversation.id)
                and call["payload"]["message_id"] == str(message.id)
                and call["payload"]["status"] == ReceiptStatus.READ
                and call["payload"]["user_id"] == str(self.recipient.id)
                for call in receipt_event_calls
            )
        )

    def test_mark_messages_read_rejects_message_outside_conversation(self):
        first_conversation = Conversation.objects.create(
            kind=ConversationKind.DIRECT,
            created_by=self.sender,
        )
        ConversationParticipantState.objects.create(
            conversation=first_conversation,
            user=self.sender,
        )
        ConversationParticipantState.objects.create(
            conversation=first_conversation,
            user=self.recipient,
        )
        second_conversation = Conversation.objects.create(
            kind=ConversationKind.DIRECT,
            created_by=self.sender,
        )
        ConversationParticipantState.objects.create(
            conversation=second_conversation,
            user=self.sender,
        )
        ConversationParticipantState.objects.create(
            conversation=second_conversation,
            user=self.recipient,
        )
        other_message = Message.objects.create(
            conversation=second_conversation,
            sender=self.sender,
            message_type=MessageType.TEXT,
            client_message_id="receipt-message-002",
            ciphertext={"body": "ciphertext"},
        )

        self.authenticate(self.recipient)
        response = self.client.post(
            reverse("messaging-read-receipts", args=[first_conversation.id]),
            {"message_id": str(other_message.id)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["code"], "message_not_found")
