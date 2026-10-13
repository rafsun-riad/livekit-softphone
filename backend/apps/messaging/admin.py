from django.contrib import admin

from .models import (
    Conversation,
    ConversationParticipantState,
    Message,
    MessageAttachment,
    MessageReceipt,
    OneTimePreKey,
    SignedPreKey,
    UserIdentityKey,
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "created_by", "latest_message_at", "created_at")
    list_filter = ("kind", "created_at", "latest_message_at")
    search_fields = ("id", "subject", "created_by__phone_number_normalized")
    autocomplete_fields = ("created_by",)
    readonly_fields = ("created_at", "updated_at", "latest_message_at")


@admin.register(ConversationParticipantState)
class ConversationParticipantStateAdmin(admin.ModelAdmin):
    list_display = ("conversation", "user", "last_read_at", "archived_at", "is_hidden")
    list_filter = ("is_hidden", "archived_at", "created_at")
    search_fields = ("conversation__id", "user__phone_number_normalized")
    autocomplete_fields = ("conversation", "user", "last_read_message")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "message_type", "created_at")
    list_filter = ("message_type", "created_at", "deleted_at")
    search_fields = ("id", "conversation__id", "sender__phone_number_normalized")
    autocomplete_fields = ("conversation", "sender")
    readonly_fields = ("created_at", "updated_at", "edited_at", "deleted_at")


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = (
        "message",
        "attachment_kind",
        "mime_type",
        "size_bytes",
        "created_at",
    )
    list_filter = ("attachment_kind", "mime_type", "created_at")
    search_fields = ("message__id", "storage_key", "sha256_hex")
    autocomplete_fields = ("message",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(MessageReceipt)
class MessageReceiptAdmin(admin.ModelAdmin):
    list_display = ("message", "user", "status", "status_at")
    list_filter = ("status", "status_at")
    search_fields = ("message__id", "user__phone_number_normalized")
    autocomplete_fields = ("message", "user")
    readonly_fields = ("created_at", "updated_at", "status_at")


@admin.register(UserIdentityKey)
class UserIdentityKeyAdmin(admin.ModelAdmin):
    list_display = ("user", "installation_id", "algorithm", "is_active", "created_at")
    list_filter = ("algorithm", "is_active", "created_at")
    search_fields = ("user__phone_number_normalized", "installation_id", "fingerprint")
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at", "revoked_at")


@admin.register(SignedPreKey)
class SignedPreKeyAdmin(admin.ModelAdmin):
    list_display = ("identity_key", "key_id", "expires_at", "created_at")
    list_filter = ("expires_at", "created_at")
    search_fields = ("identity_key__user__phone_number_normalized", "key_id")
    autocomplete_fields = ("identity_key",)
    readonly_fields = ("created_at", "updated_at", "revoked_at")


@admin.register(OneTimePreKey)
class OneTimePreKeyAdmin(admin.ModelAdmin):
    list_display = ("identity_key", "key_id", "claimed_at", "created_at")
    list_filter = ("claimed_at", "created_at")
    search_fields = ("identity_key__user__phone_number_normalized", "key_id")
    autocomplete_fields = ("identity_key",)
    readonly_fields = ("created_at", "updated_at", "claimed_at")
