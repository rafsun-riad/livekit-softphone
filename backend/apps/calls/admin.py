from django.contrib import admin

from .models import Call, CallEvent


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "initiator",
        "recipient",
        "call_type",
        "state",
        "provider",
        "created_at",
    )
    list_filter = ("call_type", "state", "provider", "created_at")
    search_fields = (
        "id",
        "room_name",
        "initiator__email",
        "initiator__phone_number_normalized",
        "recipient__email",
        "recipient__phone_number_normalized",
    )
    autocomplete_fields = ("initiator", "recipient")
    readonly_fields = (
        "created_at",
        "updated_at",
        "initiated_at",
        "ringing_at",
        "accepted_at",
        "connected_at",
        "ended_at",
    )


@admin.register(CallEvent)
class CallEventAdmin(admin.ModelAdmin):
    list_display = ("call", "event_type", "actor_user", "created_at")
    list_filter = ("event_type", "created_at")
    search_fields = ("call__id", "event_type", "actor_user__phone_number_normalized")
    autocomplete_fields = ("call", "actor_user")
    readonly_fields = ("created_at",)
