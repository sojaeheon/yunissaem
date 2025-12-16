from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework import status

from django.db.models import Q
from .models import ChatRoom, Message
from courses.models import Course
from accounts.models import User


class ChatRoomCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        course_id = request.data.get("course_id")
        tutor_id = request.data.get("tutor_id")

        # 현재 로그인한 유저 = 튜티
        tutee = request.user

        # FK 객체 로드
        course = get_object_or_404(Course, id=course_id)
        tutor = get_object_or_404(User, id=tutor_id)

        # 과외에 설정된 tutor인지 검증
        if course.tutor != tutor:
            return Response(
                {"error": "해당 과외의 담당 튜터가 아닙니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 채팅방 존재 여부 확인 및 생성
        room, created = ChatRoom.objects.get_or_create(
            courses=course,
            tutor=tutor,
            tutee=tutee
        )

        return Response({
            "room_id": room.id,
            "created": created
        })

    def get(self, request):

        user = request.user

        # 채팅방 조회
        chatrooms = ChatRoom.objects.filter(
            Q(tutor=user) | Q(tutee=user)
        ).select_related("courses", "tutor", "tutee")

        chatroom_list = []
        for room in chatrooms:
            # 상대방 정보 설정
            if room.tutor == user:
                other_user = room.tutee
            else:
                other_user = room.tutor

            # 안 읽은 메시지 수
            unread_count = Message.objects.filter(
                chatroom=room,
                sender=other_user,
                is_read=False
            ).count()

            last_message_obj = Message.objects.filter(
                chatroom=room
            ).order_by('-created_at').first()

            chatroom_list.append({
                "room_id": room.id,
                "course_id": room.courses.id,
                "course_title": room.courses.title,
                "other_user_id": other_user.id,
                "other_user_name": other_user.name,
                "other_user_profile_image": other_user.profile_image or None,
                "unread_message_count": unread_count,
                "created_at": room.created_at,
                "last_message": last_message_obj.content if last_message_obj else "",
                "last_message_time": last_message_obj.created_at if last_message_obj else None,
            })

        return Response(chatroom_list)
    
class ChatRoomReadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        user = request.user

        # 채팅방 로드
        chatroom = get_object_or_404(ChatRoom, id=room_id)

        # 채팅방 참여자 검증
        if user != chatroom.tutor and user != chatroom.tutee:
            return Response(
                {"error": "이 채팅방에 접근할 권한이 없습니다."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 안 읽은 메시지 읽음 처리
        updated_count = Message.objects.filter(
            chatroom=chatroom,
            is_read=False
        ).exclude(sender=user).update(is_read=True)

        return Response(
            {
                "room_id": chatroom.id,
                "updated_count": updated_count,
            },
            status=status.HTTP_200_OK
        )