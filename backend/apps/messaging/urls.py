from django.urls import path

from .views import (
    ConversationDetailView,
    ConversationListView,
    DirectConversationCreateView,
    MessageListCreateView,
    MessageReadReceiptView,
)

urlpatterns = [
    path(
        "conversations/", ConversationListView.as_view(), name="messaging-conversations"
    ),
    path(
        "conversations/direct/",
        DirectConversationCreateView.as_view(),
        name="messaging-conversations-direct",
    ),
    path(
        "conversations/<uuid:conversation_id>/",
        ConversationDetailView.as_view(),
        name="messaging-conversations-detail",
    ),
    path(
        "conversations/<uuid:conversation_id>/messages/",
        MessageListCreateView.as_view(),
        name="messaging-messages",
    ),
    path(
        "conversations/<uuid:conversation_id>/receipts/read/",
        MessageReadReceiptView.as_view(),
        name="messaging-read-receipts",
    ),
]
