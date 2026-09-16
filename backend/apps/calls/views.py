from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CallCreateSerializer,
    CallSerializer,
    JoinMediaResponseSerializer,
)
from .services import CallService, CallServiceError


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


class CallCreateView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = CallCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                code="call_create_failed",
                message="Unable to start the call.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            call = CallService.create_call(
                initiator=request.user,
                recipient_user_id=serializer.validated_data["recipient_user_id"],
                call_type=serializer.validated_data["call_type"],
            )
        except CallServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        return Response(
            CallSerializer(call, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class CallDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, call_id):
        try:
            call = CallService.get_call(call_id=call_id, user=request.user)
        except CallServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        return Response(
            CallSerializer(call, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class CallActionView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    action_name = ""

    def post(self, request, call_id):
        try:
            call = getattr(CallService, self.action_name)(
                call_id=call_id, user=request.user
            )
        except CallServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        return Response(
            CallSerializer(call, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class CallAcceptView(CallActionView):
    action_name = "accept_call"


class CallRejectView(CallActionView):
    action_name = "reject_call"


class CallCancelView(CallActionView):
    action_name = "cancel_call"


class CallEndView(CallActionView):
    action_name = "end_call"


class CallJoinMediaView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, call_id):
        try:
            payload = CallService.join_media(call_id=call_id, user=request.user)
        except CallServiceError as error:
            return error_response(
                code=error.code,
                message=error.message,
                details=error.details,
                status_code=error.status_code,
            )

        serialized = JoinMediaResponseSerializer(
            {
                **payload,
                "call": CallSerializer(
                    payload["call"],
                    context={"request": request},
                ).data,
            }
        )
        return Response(serialized.data, status=status.HTTP_200_OK)
