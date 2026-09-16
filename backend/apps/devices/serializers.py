from rest_framework import serializers

from .models import Device, DevicePlatform, PushProvider


class DeviceSerializer(serializers.ModelSerializer[Device]):
    class Meta:
        model = Device
        fields = (
            "id",
            "platform",
            "push_provider",
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
    push_token = serializers.CharField(trim_whitespace=True)
    app_version = serializers.CharField(max_length=50)
    device_label = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    def create(self, validated_data: dict[str, object]) -> Device:
        request = self.context["request"]
        device, _ = Device.objects.update_or_create(
            user=request.user,
            push_token=validated_data["push_token"],
            defaults={
                "platform": validated_data["platform"],
                "push_provider": validated_data["push_provider"],
                "app_version": validated_data["app_version"],
                "device_label": validated_data.get("device_label", ""),
                "is_active": True,
                "invalidated_at": None,
            },
        )
        return device
