from apps.accounts.models import User
from django.test import TestCase

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
