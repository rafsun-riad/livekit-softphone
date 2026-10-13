from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ConversationSerializer,
    DirectConversationCreateSerializer,
    MessageCreateSerializer,
    MessageSerializer,
    prefetch_conversation_queryset,
)
from .services import (
    MessagingService,
    MessagingServiceError,
    get_conversation_for_user,
    get_messages_for_user,
    get_user_conversation_queryset,
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


class ConversationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = prefetch_conversation_queryset(
            get_user_conversation_queryset(user=request.user)
        )
        return Response(ConversationSerializer(queryset, many=True).data)


class DirectConversationCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DirectConversationCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(
                code="conversation_create_failed",
                message="Unable to start the conversation.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            conversation, created = MessagingService.get_or_create_direct_conversation(
                user=request.user,
                target_user=serializer.validated_data["target_user"],
            )
        except MessagingServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        payload = ConversationSerializer(
            prefetch_conversation_queryset(
                get_user_conversation_queryset(user=request.user).filter(
                    id=conversation.id
                )
            ).first()
        ).data
        return Response(
            payload,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ConversationDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            conversation = get_conversation_for_user(
                conversation_id=conversation_id,
                user=request.user,
            )
        except MessagingServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        prefetched = prefetch_conversation_queryset(
            get_user_conversation_queryset(user=request.user).filter(id=conversation.id)
        ).first()
        return Response(ConversationSerializer(prefetched).data)


class MessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        try:
            messages = get_messages_for_user(
                conversation_id=conversation_id,
                user=request.user,
            )
        except MessagingServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        return Response(MessageSerializer(messages, many=True).data)

    def post(self, request, conversation_id):
        serializer = MessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                code="message_create_failed",
                message="Unable to create the message.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            message = MessagingService.create_message(
                conversation_id=conversation_id,
                user=request.user,
                message_type=serializer.validated_data["message_type"],
                ciphertext=serializer.validated_data["ciphertext"],
                client_message_id=serializer.validated_data.get(
                    "client_message_id", ""
                ),
            )
        except MessagingServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
