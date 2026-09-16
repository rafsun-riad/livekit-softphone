from django.contrib import admin

from .models import Device


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "platform",
        "push_provider",
        "device_label",
        "is_active",
        "last_seen_at",
    )
    list_filter = ("platform", "push_provider", "is_active", "created_at")
    search_fields = (
        "id",
        "user__email",
        "user__phone_number",
        "user__phone_number_normalized",
        "device_label",
        "push_token",
    )
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at", "updated_at", "last_seen_at", "invalidated_at")
