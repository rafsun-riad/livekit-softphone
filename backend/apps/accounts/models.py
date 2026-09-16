from __future__ import annotations

import hashlib
import secrets
from typing import Any, ClassVar

import phonenumbers
from apps.common.models import UUIDTimeStampedModel
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def normalize_phone_number(value: str) -> str:
    if not value:
        raise ValidationError({"phone_number": "Phone number is required."})

    default_region = None
    cleaned_value = value.strip()
    if not cleaned_value.startswith("+"):
        default_region = getattr(settings, "PHONENUMBER_DEFAULT_REGION", None)

    try:
        parsed = phonenumbers.parse(cleaned_value, default_region)
    except phonenumbers.NumberParseException as exc:
        raise ValidationError({"phone_number": "Enter a valid phone number."}) from exc

    if not phonenumbers.is_valid_number(parsed):
        raise ValidationError({"phone_number": "Enter a valid phone number."})

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


class UserManager(BaseUserManager["User"]):
    use_in_migrations = True

    def _create_user(
        self,
        phone_number: str | None,
        email: str,
        password: str | None,
        phone_number_normalized: str | None = None,
        **extra_fields: Any,
    ) -> User:
        if not email:
            raise ValueError("The email field is required.")
        if not phone_number and not phone_number_normalized:
            raise ValueError("The phone number field is required.")

        source_phone_number = phone_number or phone_number_normalized or ""
        normalized_phone = normalize_phone_number(source_phone_number)
        normalized_email = self.normalize_email(email).lower()

        user = self.model(
            phone_number=phone_number or source_phone_number,
            phone_number_normalized=normalized_phone,
            email=normalized_email,
            **extra_fields,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(
        self,
        phone_number: str | None,
        email: str,
        password: str | None = None,
        phone_number_normalized: str | None = None,
        **extra_fields: Any,
    ) -> User:
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(
            phone_number,
            email,
            password,
            phone_number_normalized=phone_number_normalized,
            **extra_fields,
        )

    def create_superuser(
        self,
        email: str,
        password: str,
        phone_number: str | None = None,
        phone_number_normalized: str | None = None,
        **extra_fields: Any,
    ) -> User:
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(
            phone_number,
            email,
            password,
            phone_number_normalized=phone_number_normalized,
            **extra_fields,
        )


class User(UUIDTimeStampedModel, AbstractUser):
    username = None
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=32)
    phone_number_normalized = models.CharField(
        "phone number", max_length=32, unique=True
    )
    display_name = models.CharField(max_length=150, blank=True)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "phone_number_normalized"
    REQUIRED_FIELDS: ClassVar[list[str]] = ["email"]

    objects = UserManager()

    def clean(self) -> None:
        super().clean()
        self.email = self.__class__.objects.normalize_email(self.email).lower()
        self.phone_number_normalized = normalize_phone_number(self.phone_number)
        if not self.display_name:
            self.display_name = self.get_full_name().strip()

    def mark_email_verified(self) -> None:
        self.email_verified_at = timezone.now()

    def mark_phone_verified(self) -> None:
        self.phone_verified_at = timezone.now()

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.display_name or self.phone_number_normalized


class DeviceSession(UUIDTimeStampedModel):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="device_sessions",
    )
    token_hash = models.CharField(max_length=64, unique=True)
    device_label = models.CharField(max_length=150, blank=True)
    last_used_at = models.DateTimeField(auto_now_add=True)
    rotated_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoke_reason = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-last_used_at"]

    @staticmethod
    def hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    @classmethod
    def create_with_token(
        cls,
        *,
        user: User,
        device_label: str = "",
    ) -> tuple[DeviceSession, str]:
        raw_token = secrets.token_urlsafe(48)
        session = cls.objects.create(
            user=user,
            token_hash=cls.hash_token(raw_token),
            device_label=device_label,
        )
        return session, raw_token

    def rotate_token(self) -> str:
        raw_token = secrets.token_urlsafe(48)
        self.token_hash = self.hash_token(raw_token)
        self.rotated_at = timezone.now()
        self.last_used_at = self.rotated_at
        self.save(
            update_fields=["token_hash", "rotated_at", "last_used_at", "updated_at"]
        )
        return raw_token

    def mark_used(self) -> None:
        self.last_used_at = timezone.now()
        self.save(update_fields=["last_used_at", "updated_at"])

    def revoke(self, reason: str) -> None:
        self.revoked_at = timezone.now()
        self.revoke_reason = reason
        self.save(update_fields=["revoked_at", "revoke_reason", "updated_at"])

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None
