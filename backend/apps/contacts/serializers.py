from apps.accounts.models import User
from apps.accounts.serializers import UserDiscoverySerializer
from rest_framework import serializers

from .models import Contact, ContactStatus


class ContactSerializer(serializers.ModelSerializer[Contact]):
    contact_user = UserDiscoverySerializer(read_only=True)

    class Meta:
        model = Contact
        fields = ("id", "status", "contact_user", "created_at", "updated_at")
        read_only_fields = fields


class ContactCreateSerializer(serializers.Serializer[dict[str, object]]):
    target_user_id = serializers.UUIDField()

    def validate(self, attrs: dict[str, object]) -> dict[str, object]:
        request = self.context["request"]
        target_user = User.objects.filter(
            id=attrs["target_user_id"],
            is_active=True,
        ).first()

        if target_user is None:
            raise serializers.ValidationError(
                {"target_user_id": "The selected user does not exist."}
            )

        if target_user.id == request.user.id:
            raise serializers.ValidationError(
                {"target_user_id": "You cannot add yourself as a contact."}
            )

        if Contact.objects.filter(
            owner=request.user,
            contact_user=target_user,
        ).exists():
            raise serializers.ValidationError(
                {"target_user_id": "This user is already in your contacts."}
            )

        attrs["target_user"] = target_user
        return attrs

    def create(self, validated_data: dict[str, object]) -> Contact:
        request = self.context["request"]
        return Contact.objects.create(
            owner=request.user,
            contact_user=validated_data["target_user"],
            status=ContactStatus.ACCEPTED,
        )
