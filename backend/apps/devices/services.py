from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from types import SimpleNamespace

import firebase_admin
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from firebase_admin import credentials, messaging

from .models import Device, PushProvider


@dataclass(frozen=True)
class PushSendResult:
    success_count: int
    failure_count: int
    successful_tokens: list[str]
    failed_tokens: list[str]
    message_ids: list[str]


def build_firebase_service_account_info() -> dict[str, str]:
    project_id = getattr(settings, "FCM_PROJECT_ID", "")
    client_email = getattr(settings, "FCM_CLIENT_EMAIL", "")
    private_key = getattr(settings, "FCM_PRIVATE_KEY", "")

    if not all([project_id, client_email, private_key]):
        raise ImproperlyConfigured(
            "Firebase Cloud Messaging is not fully configured in the environment."
        )

    return {
        "type": "service_account",
        "project_id": project_id,
        "client_email": client_email,
        "private_key": private_key,
        "token_uri": "https://oauth2.googleapis.com/token",
    }


def get_firebase_app():
    app_name = f"fcm-{settings.FCM_PROJECT_ID}"

    try:
        return firebase_admin.get_app(app_name)
    except ValueError:
        certificate = credentials.Certificate(build_firebase_service_account_info())
        return firebase_admin.initialize_app(
            certificate,
            options={"projectId": settings.FCM_PROJECT_ID},
            name=app_name,
        )


class DevicePushService:
    @staticmethod
    def get_active_fcm_devices_for_user(user) -> list[Device]:
        return list(
            Device.objects.filter(
                user=user,
                is_active=True,
                push_provider=PushProvider.FCM,
            ).exclude(push_token="")
        )

    @staticmethod
    def send_to_devices(
        *,
        devices: Iterable[Device | SimpleNamespace],
        title: str | None = None,
        body: str | None = None,
        data: dict[str, str] | None = None,
        dry_run: bool = False,
    ) -> PushSendResult:
        eligible_devices = [
            device
            for device in devices
            if getattr(device, "is_active", False)
            and getattr(device, "push_provider", None) == PushProvider.FCM
            and getattr(device, "push_token", "")
        ]
        tokens = [device.push_token for device in eligible_devices]

        if not tokens:
            return PushSendResult(
                success_count=0,
                failure_count=0,
                successful_tokens=[],
                failed_tokens=[],
                message_ids=[],
            )

        notification = None
        if title or body:
            notification = messaging.Notification(title=title, body=body)

        multicast_message = messaging.MulticastMessage(
            tokens=tokens,
            data=data or {},
            notification=notification,
        )
        response = messaging.send_each_for_multicast(
            multicast_message,
            dry_run=dry_run,
            app=get_firebase_app(),
        )

        successful_tokens: list[str] = []
        failed_tokens: list[str] = []
        message_ids: list[str] = []

        for index, send_response in enumerate(response.responses):
            token = tokens[index]
            if send_response.success:
                successful_tokens.append(token)
                if send_response.message_id:
                    message_ids.append(send_response.message_id)
            else:
                failed_tokens.append(token)

        return PushSendResult(
            success_count=response.success_count,
            failure_count=response.failure_count,
            successful_tokens=successful_tokens,
            failed_tokens=failed_tokens,
            message_ids=message_ids,
        )

    @classmethod
    def send_to_user_devices(
        cls,
        *,
        user,
        title: str | None = None,
        body: str | None = None,
        data: dict[str, str] | None = None,
        dry_run: bool = False,
    ) -> PushSendResult:
        return cls.send_to_devices(
            devices=cls.get_active_fcm_devices_for_user(user),
            title=title,
            body=body,
            data=data,
            dry_run=dry_run,
        )
