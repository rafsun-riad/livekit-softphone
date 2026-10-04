from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers

from .models import Device, DevicePlatform, PushProvider


class DeviceSerializer(serializers.ModelSerializer[Device]):
    class Meta:
        model = Device
        fields = (
            "id",
            "platform",
            "push_provider",
            "installation_id",
            "push_token",
            "app_version",
            "device_label",
            "last_seen_at",
            "is_active",
            "invalidated_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class DeviceRegisterSerializer(serializers.Serializer[dict[str, object]]):
    platform = serializers.ChoiceField(choices=DevicePlatform.choices)
    push_provider = serializers.ChoiceField(
        choices=PushProvider.choices,
        required=False,
        default=PushProvider.FCM,
    )
    installation_id = serializers.UUIDField()
    push_token = serializers.CharField(trim_whitespace=True)
    app_version = serializers.CharField(max_length=50)
    device_label = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    @transaction.atomic
    def create(self, validated_data: dict[str, object]) -> Device:
        request = self.context["request"]
        installation_id = validated_data["installation_id"]
        push_token = validated_data["push_token"]
        now = timezone.now()

        Device.objects.filter(
            Q(installation_id=installation_id) | Q(push_token=push_token),
            is_active=True,
        ).exclude(
            user=request.user,
            installation_id=installation_id,
        ).update(
            is_active=False,
            invalidated_at=now,
            updated_at=now,
        )

        matching_devices = list(
            Device.objects.filter(user=request.user)
            .filter(Q(installation_id=installation_id) | Q(push_token=push_token))
            .order_by("-last_seen_at", "-created_at")
        )

        device = matching_devices[0] if matching_devices else None
        for duplicate in matching_devices[1:]:
            if duplicate.is_active:
                duplicate.is_active = False
                duplicate.invalidated_at = now
                duplicate.save(
                    update_fields=["is_active", "invalidated_at", "updated_at"]
                )

        if device is None:
            device = Device.objects.create(
                user=request.user,
                platform=validated_data["platform"],
                push_provider=validated_data["push_provider"],
                installation_id=installation_id,
                push_token=push_token,
                app_version=validated_data["app_version"],
                device_label=validated_data.get("device_label", ""),
                is_active=True,
                invalidated_at=None,
            )
            return device

        device.platform = validated_data["platform"]
        device.push_provider = validated_data["push_provider"]
        device.installation_id = installation_id
        device.push_token = push_token
        device.app_version = validated_data["app_version"]
        device.device_label = validated_data.get("device_label", "")
        device.is_active = True
        device.invalidated_at = None
        device.save()
        return device
