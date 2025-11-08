from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Course
from .serializers import CourseDetailSerializer
from accounts.models import User

class CourseDetailView(APIView):
    """
    과외 상세 조회 API (APIView 버전)
    - 과외 상세 정보 반환
    - 조회수(view_count) 증가
    """

    def get(self, request, course_id):
        # --- 테스트용 로그인 가정 코드 ---
        try:
            user = User.objects.get(id=1)
        except User.DoesNotExist:
            return Response({"error": "테스트용 유저(id=1)가 DB에 없습니다."},
                            status=status.HTTP_404_NOT_FOUND)
        request.user = user
        # --- 임시 코드 끝 ---

        # 과외 조회
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"error": "해당 과외가 존재하지 않습니다."},
                            status=status.HTTP_404_NOT_FOUND)

        # ✅ 조회수 증가
        course.view_count += 1
        course.save(update_fields=["view_count"])

        # 직렬화 후 응답
        serializer = CourseDetailSerializer(course, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
