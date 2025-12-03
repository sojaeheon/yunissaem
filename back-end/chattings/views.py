# chat/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from rest_framework import status

from .models import ChatRoom
from courses.models import Course
from accounts.models import User


class ChatRoomCreateAPIView(APIView):
    # permission_classes = [IsAuthenticated]

    def post(self, request):
        course_id = request.data.get("course_id")
        tutor_id = request.data.get("tutor_id")

        # --- 임시 로그인 코드 ---
        try:
            user = User.objects.get(id=1)
        except User.DoesNotExist:
            return Response({"error": "테스트용 유저(id=1)가 없습니다."},
                            status=status.HTTP_404_NOT_FOUND)
        request.user = user
        # --- 임시 코드 끝 ---

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
