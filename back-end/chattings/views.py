from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework import status
from django_redis import get_redis_connection
from django.db.models import Q

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import ChatRoom, Message
from .serializers import MessageSerializer
from courses.models import Course
from accounts.models import User


# =========================================================
# 💬 채팅방 생성 API
# =========================================================
class ChatRoomCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="채팅방 생성",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "course_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                "tutor_id": openapi.Schema(type=openapi.TYPE_INTEGER),
            },
            required=["course_id", "tutor_id"]
        ),
        responses={201: "채팅방 생성 완료"}
    )
    def post(self, request):
        course_id = request.data.get("course_id")
        tutor_id = request.data.get("tutor_id")
        tutee = request.user

        course = get_object_or_404(Course, id=course_id)
        tutor = get_object_or_404(User, id=tutor_id)

        if course.tutor != tutor:
            return Response(
                {"error": "해당 과외의 담당 튜터가 아닙니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        room, created = ChatRoom.objects.get_or_create(
            courses=course,
            tutor=tutor,
            tutee=tutee
        )

        return Response(
            {"room_id": room.id, "created": created},
            status=status.HTTP_201_CREATED
        )


# =========================================================
# 📋 채팅방 목록 조회 API
# =========================================================
class ChatRoomListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(operation_summary="내 채팅방 목록 조회")
    def get(self, request):
        user = request.user
        redis = get_redis_connection("default")

        chatrooms = ChatRoom.objects.filter(
            Q(tutor=user) | Q(tutee=user)
        ).select_related("courses", "tutor", "tutee")

        result = []

        for room in chatrooms:
            other_user = room.tutee if room.tutor == user else room.tutor

            unread_key = f"chatroom:{room.id}:unread:{user.id}"
            last_message_key = f"chatroom:{room.id}:last_message"
            last_time_key = f"chatroom:{room.id}:last_message_time"

            unread_count = redis.get(unread_key)
            if unread_count is None:
                unread_count = Message.objects.filter(
                    chatroom=room,
                    sender=other_user,
                    is_read=False
                ).count()
                redis.set(unread_key, unread_count)
            else:
                unread_count = int(unread_count)

            last_message = redis.get(last_message_key)
            last_message_time = redis.get(last_time_key)

            if last_message is None:
                last_msg = Message.objects.filter(chatroom=room).order_by("-created_at").first()
                if last_msg:
                    redis.set(last_message_key, last_msg.content)
                    redis.set(last_time_key, str(last_msg.created_at))
                    last_message = last_msg.content
                    last_message_time = last_msg.created_at
                else:
                    last_message = ""
                    last_message_time = None
            else:
                last_message = last_message.decode()
                last_message_time = last_message_time.decode() if last_message_time else None

            result.append({
                "room_id": room.id,
                "course_id": room.courses.id,
                "course_title": room.courses.title,
                "other_user_id": other_user.id,
                "other_user_name": other_user.name,
                "other_user_profile_image": other_user.profile_image,
                "unread_message_count": unread_count,
                "last_message": last_message,
                "last_message_time": last_message_time,
                "created_at": room.created_at,
            })

        return Response(result, status=status.HTTP_200_OK)


# =========================================================
# 👁 채팅방 읽음 처리 API
# =========================================================
class ChatRoomReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(operation_summary="채팅방 읽음 처리")
    def post(self, request, room_id):
        user = request.user
        redis = get_redis_connection("default")

        chatroom = get_object_or_404(ChatRoom, id=room_id)

        if user not in [chatroom.tutor, chatroom.tutee]:
            return Response(
                {"error": "이 채팅방에 접근할 권한이 없습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        updated_count = Message.objects.filter(
            chatroom=chatroom,
            is_read=False
        ).exclude(sender=user).update(is_read=True)

        redis.set(f"chatroom:{room_id}:unread:{user.id}", 0)

        return Response(
            {"room_id": room_id, "updated_count": updated_count},
            status=status.HTTP_200_OK
        )


# =========================================================
# 💬 메시지 목록 조회 API
# =========================================================
class MessageListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(operation_summary="채팅 메시지 목록 조회")
    def get(self, request, room_id):
        user = request.user
        chatroom = get_object_or_404(ChatRoom, id=room_id)

        if user not in [chatroom.tutor, chatroom.tutee]:
            return Response(
                {"error": "이 채팅방에 접근할 권한이 없습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        messages = Message.objects.filter(chatroom=chatroom).order_by("created_at")
        serializer = MessageSerializer(messages, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)
