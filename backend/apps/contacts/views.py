from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contact, ContactStatus
from .serializers import (
    ContactCreateSerializer,
    ContactSerializer,
    ContactTargetUserSerializer,
)


def error_response(
    *, code: str, message: str, details: dict | None = None, status_code: int
):
    return Response(
        {
            "code": code,
            "message": message,
            "details": details or {},
        },
        status=status_code,
    )


class ContactListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        contacts = (
            Contact.objects.select_related("contact_user")
            .filter(owner=request.user, status=ContactStatus.ACCEPTED)
            .order_by(
                "contact_user__display_name", "contact_user__phone_number_normalized"
            )
        )
        return Response(ContactSerializer(contacts, many=True).data)

    def post(self, request):
        serializer = ContactCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(
                code="contact_create_failed",
                message="Unable to create contact.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        contact = serializer.save()
        return Response(
            ContactSerializer(contact).data,
            status=status.HTTP_201_CREATED,
        )


class ContactDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, contact_id):
        deleted, _ = Contact.objects.filter(id=contact_id, owner=request.user).delete()
        if not deleted:
            return error_response(
                code="contact_not_found",
                message="Contact not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class ContactRelationshipView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, target_user_id):
        serializer = ContactTargetUserSerializer(
            data={"target_user_id": str(target_user_id)},
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(
                code="contact_relationship_failed",
                message="Unable to fetch the contact relationship.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        target_user = serializer.validated_data["target_user"]
        own_relation = Contact.objects.filter(
            owner=request.user,
            contact_user=target_user,
        ).first()
        reverse_relation = Contact.objects.filter(
            owner=target_user,
            contact_user=request.user,
        ).first()

        own_status = own_relation.status if own_relation else "none"
        payload = {
            "target_user": {
                "id": str(target_user.id),
                "phone_number_normalized": target_user.phone_number_normalized,
                "display_name": target_user.display_name,
                "first_name": target_user.first_name,
                "last_name": target_user.last_name,
            },
            "status": own_status,
            "is_saved": own_status == ContactStatus.ACCEPTED,
            "is_blocked_by_you": own_status == ContactStatus.BLOCKED,
            "is_blocked_by_target": bool(
                reverse_relation and reverse_relation.status == ContactStatus.BLOCKED
            ),
            "contact_id": str(own_relation.id) if own_relation else None,
        }
        return Response(payload, status=status.HTTP_200_OK)


class ContactSaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ContactTargetUserSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(
                code="contact_save_failed",
                message="Unable to save contact.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        target_user = serializer.validated_data["target_user"]
        contact, created = Contact.objects.update_or_create(
            owner=request.user,
            contact_user=target_user,
            defaults={"status": ContactStatus.ACCEPTED},
        )

        return Response(
            ContactSerializer(contact).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ContactBlockView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ContactTargetUserSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(
                code="contact_block_failed",
                message="Unable to block user.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        target_user = serializer.validated_data["target_user"]
        contact, created = Contact.objects.update_or_create(
            owner=request.user,
            contact_user=target_user,
            defaults={"status": ContactStatus.BLOCKED},
        )

        return Response(
            ContactSerializer(contact).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ContactUnblockView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ContactTargetUserSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(
                code="contact_unblock_failed",
                message="Unable to unblock user.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        target_user = serializer.validated_data["target_user"]
        contact, created = Contact.objects.update_or_create(
            owner=request.user,
            contact_user=target_user,
            defaults={"status": ContactStatus.REJECTED},
        )

        return Response(
            {
                "status": contact.status,
                "contact_id": str(contact.id),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
