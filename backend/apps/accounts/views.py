from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    AuthResponseSerializer,
    AuthService,
    DeviceSessionTokenSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSummarySerializer,
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


def serialize_auth_payload(auth_payload: dict) -> dict:
    serializer = AuthResponseSerializer(
        {
            **auth_payload,
            "user": UserSummarySerializer(auth_payload["user"]).data,
        }
    )
    return serializer.data


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                code="registration_failed",
                message="Unable to register account.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()
        return Response(
            UserSummarySerializer(user).data, status=status.HTTP_201_CREATED
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return error_response(
                code="invalid_credentials",
                message="Invalid phone number or password.",
                details=serializer.errors,
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        auth_payload = AuthService.login(
            user=serializer.validated_data["user"],
            device_label=serializer.validated_data.get("device_label", ""),
        )
        return Response(serialize_auth_payload(auth_payload), status=status.HTTP_200_OK)


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = DeviceSessionTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                code="invalid_device_session",
                message="Device session token is required.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        auth_payload = AuthService.refresh(
            raw_token=serializer.validated_data["device_session_token"],
            rotate=getattr(settings, "DEVICE_SESSION_ROTATION", True),
        )
        if auth_payload is None:
            return error_response(
                code="invalid_device_session",
                message="Device session is invalid or revoked.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(serialize_auth_payload(auth_payload), status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeviceSessionTokenSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                code="invalid_device_session",
                message="Device session token is required.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        logged_out = AuthService.logout(
            user=request.user,
            raw_token=serializer.validated_data["device_session_token"],
        )
        if not logged_out:
            return error_response(
                code="invalid_device_session",
                message="Device session is invalid or revoked.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({"success": True}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(
            UserSummarySerializer(request.user).data, status=status.HTTP_200_OK
        )
