from __future__ import annotations

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .presence import broadcast_presence_change
from .realtime import user_group_name


class SignalingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or not getattr(user, "is_authenticated", False):
            await self.close(code=4401)
            return

        self.user = user
        self.group_name = user_group_name(user.id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await broadcast_presence_change(user=user, event_type="presence.user_online")
        await self.send_json(
            {
                "type": "connection.ready",
                "payload": {
                    "user_id": str(user.id),
                },
            }
        )

    async def disconnect(self, code):
        user = getattr(self, "user", None)
        group_name = getattr(self, "group_name", None)
        if group_name:
            await self.channel_layer.group_discard(group_name, self.channel_name)

        if user is not None and getattr(user, "is_authenticated", False):
            await broadcast_presence_change(
                user=user, event_type="presence.user_offline"
            )

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type")
        if event_type == "client.ping":
            await self.send_json({"type": "client.pong", "payload": {}})
        elif event_type == "client.ack":
            await self.send_json(
                {"type": "server.ack", "payload": content.get("payload", {})}
            )

    async def dispatch_event(self, event):
        await self.send_json(
            {
                "type": event["event_type"],
                "payload": event["payload"],
            }
        )
