from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Device
from .serializers import DeviceRegisterSerializer, DeviceSerializer


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


class DeviceRegisterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = DeviceRegisterSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return error_response(
                code="device_register_failed",
                message="Unable to register device.",
                details=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        device = serializer.save()
        return Response(DeviceSerializer(device).data, status=status.HTTP_200_OK)


class DeviceListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        devices = Device.objects.filter(user=request.user).order_by("-last_seen_at")
        return Response(
            DeviceSerializer(devices, many=True).data, status=status.HTTP_200_OK
        )


class DeviceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, device_id):
        device = Device.objects.filter(id=device_id, user=request.user).first()
        if device is None:
            return error_response(
                code="device_not_found",
                message="Device not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        device.is_active = False
        device.invalidated_at = timezone.now()
        device.save(update_fields=["is_active", "invalidated_at", "updated_at"])

        return Response(status=status.HTTP_204_NO_CONTENT)
