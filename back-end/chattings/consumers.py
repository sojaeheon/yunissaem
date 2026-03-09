from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django_redis import get_redis_connection

from .models import ChatRoom, Message


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.room_id = int(self.scope["url_route"]["kwargs"]["room_id"])
        self.user = self.scope["user"]

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4401)
            return

        is_member = await self._is_room_member(self.room_id, self.user.id)
        if not is_member:
            await self.close(code=4403)
            return

        self.group_name = f"chat_room_{self.room_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        text = (content.get("message") or "").strip()
        if not text:
            return

        message = await self._create_message(self.room_id, self.user.id, text)
        await self._update_chatroom_cache(
            room_id=self.room_id,
            sender_id=self.user.id,
            message_text=message["content"],
            created_at=message["created_at"],
        )

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message_id": message["id"],
                "room_id": self.room_id,
                "sender_id": self.user.id,
                "sender_name": self.user.name or self.user.username,
                "message": message["content"],
                "created_at": message["created_at"],
            },
        )

    async def chat_message(self, event):
        await self.send_json(
            {
                "message_id": event["message_id"],
                "room_id": event["room_id"],
                "sender_id": event["sender_id"],
                "sender_name": event["sender_name"],
                "message": event["message"],
                "created_at": event["created_at"],
            }
        )

    @database_sync_to_async
    def _is_room_member(self, room_id, user_id):
        return ChatRoom.objects.filter(id=room_id).filter(
            tutor_id=user_id
        ).exists() or ChatRoom.objects.filter(id=room_id).filter(
            tutee_id=user_id
        ).exists()

    @database_sync_to_async
    def _create_message(self, room_id, user_id, text):
        msg = Message.objects.create(
            chatroom_id=room_id,
            sender_id=user_id,
            content=text,
            is_read=False,
        )
        return {
            "id": msg.id,
            "content": msg.content,
            "created_at": msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def _update_chatroom_cache(self, room_id, sender_id, message_text, created_at):
        # 채팅방 참여자를 조회해 상대방의 unread 카운트를 올린다.
        room = ChatRoom.objects.only("tutor_id", "tutee_id").get(id=room_id)
        other_user_id = room.tutee_id if room.tutor_id == sender_id else room.tutor_id

        redis = get_redis_connection("default")
        redis.set(f"chatroom:{room_id}:last_message", message_text)
        redis.set(f"chatroom:{room_id}:last_message_time", created_at)

        # 보낸 사람의 unread는 0으로 유지, 받은 사람 unread는 +1 처리한다.
        redis.set(f"chatroom:{room_id}:unread:{sender_id}", 0)
        redis.incr(f"chatroom:{room_id}:unread:{other_user_id}")
