from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = (
        "phone_number_normalized",
        "email",
        "display_name",
        "is_staff",
        "is_active",
    )
    ordering = ("phone_number_normalized",)
    search_fields = ("phone_number", "phone_number_normalized", "email", "display_name")
    fieldsets = (
        (None, {"fields": ("phone_number", "phone_number_normalized", "password")}),
        (
            "Personal info",
            {"fields": ("display_name", "first_name", "last_name", "email")},
        ),
        (
            "Verification",
            {"fields": ("phone_verified_at", "email_verified_at")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "created_at", "updated_at")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "phone_number",
                    "email",
                    "display_name",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "last_login",
        "phone_number_normalized",
    )
