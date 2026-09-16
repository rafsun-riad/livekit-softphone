from django.contrib import admin

from .models import Contact


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("owner", "contact_user", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = (
        "owner__email",
        "owner__phone_number_normalized",
        "contact_user__email",
        "contact_user__phone_number_normalized",
    )
    autocomplete_fields = ("owner", "contact_user")
    readonly_fields = ("created_at", "updated_at")
