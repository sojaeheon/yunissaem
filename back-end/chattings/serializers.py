# chat/serializers.py
from rest_framework import serializers
from .models import ChatRoom, Message
from accounts.models import User


# 채팅에서는 User전체 정보 필요없음
# 이름 + 프로필 이미지면 충분
class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "profile_image"]



class MessageSerializer(serializers.ModelSerializer):
    sender = UserSimpleSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "chatroom",
            "sender",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "sender", "is_read", "created_at"]

from .models import ChatRoom


class ChatRoomListSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="courses.title", read_only=True)
    tutor = UserSimpleSerializer(read_only=True)
    tutee = UserSimpleSerializer(read_only=True)

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "course_title",
            "tutor",
            "tutee",
            "created_at",
        ]
