from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contact, ContactStatus
from .serializers import ContactCreateSerializer, ContactSerializer


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
