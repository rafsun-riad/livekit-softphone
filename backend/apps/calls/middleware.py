from __future__ import annotations

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def get_user_from_token(token: str):
    authenticator = JWTAuthentication()
    validated_token = authenticator.get_validated_token(token)
    return authenticator.get_user(validated_token)


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        token = None
        headers = dict(scope.get("headers", []))
        authorization = headers.get(b"authorization", b"").decode("utf-8")
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()

        if not token:
            query_string = scope.get("query_string", b"").decode("utf-8")
            params = parse_qs(query_string)
            token = (params.get("token") or [None])[0]

        scope["user"] = AnonymousUser()
        if token:
            try:
                scope["user"] = await get_user_from_token(token)
            except Exception:
                scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
