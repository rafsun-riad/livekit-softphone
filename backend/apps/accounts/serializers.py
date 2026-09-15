from __future__ import annotations

from django.contrib.auth import authenticate, password_validation
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import DeviceSession, User, normalize_phone_number


class UserSummarySerializer(serializers.ModelSerializer[User]):
    class Meta:
        model = User
        fields = (
            "id",
            "phone_number",
            "phone_number_normalized",
            "email",
            "display_name",
            "first_name",
            "last_name",
            "phone_verified_at",
            "email_verified_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class RegisterSerializer(serializers.Serializer[dict[str, str]]):
    phone_number = serializers.CharField(max_length=32)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    display_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )

    def validate_phone_number(self, value: str) -> str:
        return normalize_phone_number(value)

    def validate_email(self, value: str) -> str:
        return User.objects.normalize_email(value).lower()

    def validate(self, attrs: dict[str, str]) -> dict[str, str]:
        user = User(
            phone_number=attrs["phone_number"],
            phone_number_normalized=attrs["phone_number"],
            email=attrs["email"],
            display_name=attrs.get("display_name", ""),
        )
        password_validation.validate_password(attrs["password"], user)

        if User.objects.filter(phone_number_normalized=attrs["phone_number"]).exists():
            raise serializers.ValidationError(
                {"phone_number": "An account with this phone number already exists."}
            )

        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError(
                {"email": "An account with this email already exists."}
            )

        return attrs

    def create(self, validated_data: dict[str, str]) -> User:
        return User.objects.create_user(
            phone_number=validated_data["phone_number"],
            email=validated_data["email"],
            password=validated_data["password"],
            display_name=validated_data.get("display_name", ""),
        )


class LoginSerializer(serializers.Serializer[dict[str, str]]):
    phone_number = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    device_label = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )

    default_error_messages = {
        "invalid_credentials": "Invalid phone number or password.",
    }

    def validate(self, attrs: dict[str, str]) -> dict[str, str | User]:
        normalized_phone = normalize_phone_number(attrs["phone_number"])
        user = authenticate(
            request=self.context.get("request"),
            phone_number_normalized=normalized_phone,
            password=attrs["password"],
        )

        if user is None:
            user = authenticate(
                request=self.context.get("request"),
                username=normalized_phone,
                password=attrs["password"],
            )

        if user is None:
            raise serializers.ValidationError(
                {"non_field_errors": [self.error_messages["invalid_credentials"]]}
            )

        attrs["user"] = user
        attrs["phone_number"] = normalized_phone
        return attrs


class DeviceSessionTokenSerializer(serializers.Serializer[dict[str, str]]):
    device_session_token = serializers.CharField(trim_whitespace=True)


def build_access_token(user: User) -> str:
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


class AuthResponseSerializer(serializers.Serializer[dict[str, object]]):
    access_token = serializers.CharField()
    device_session_token = serializers.CharField()
    user = UserSummarySerializer()


class AuthService:
    @staticmethod
    @transaction.atomic
    def login(*, user: User, device_label: str = "") -> dict[str, object]:
        _, raw_token = DeviceSession.create_with_token(
            user=user, device_label=device_label
        )
        return {
            "access_token": build_access_token(user),
            "device_session_token": raw_token,
            "user": user,
        }

    @staticmethod
    @transaction.atomic
    def refresh(*, raw_token: str, rotate: bool) -> dict[str, object] | None:
        token_hash = DeviceSession.hash_token(raw_token)
        session = (
            DeviceSession.objects.select_for_update()
            .select_related("user")
            .filter(token_hash=token_hash, revoked_at__isnull=True)
            .first()
        )

        if session is None:
            return None

        next_token = session.rotate_token() if rotate else raw_token
        if not rotate:
            session.mark_used()

        return {
            "access_token": build_access_token(session.user),
            "device_session_token": next_token,
            "user": session.user,
        }

    @staticmethod
    @transaction.atomic
    def logout(*, user: User, raw_token: str) -> bool:
        token_hash = DeviceSession.hash_token(raw_token)
        session = (
            DeviceSession.objects.select_for_update()
            .filter(user=user, token_hash=token_hash, revoked_at__isnull=True)
            .first()
        )

        if session is None:
            return False

        session.revoke("logout")
        return True
