from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Course, WishedCourses
from .serializers import CourseDetailSerializer
from accounts.models import User

class CourseDetailView(APIView):
    """
    GET : 과외 상세 조회
    PATCH : 과외 수정
    """

    

    def get(self, request, course_id):
        """
        과외 상세 조회 API
        - 과외 상세 정보 반환
        - 조회수(view_count) 증가
        """
        # --- 임시 로그인 코드 ---
        try:
            user = User.objects.get(id=1)
        except User.DoesNotExist:
            return Response({"error": "테스트용 유저(id=1)가 없습니다."},
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
    
    def patch(self, request, course_id):
        """
        과외 수정 (튜터만 가능)
        """
        # --- 임시 로그인 (User id=739) ---
        # course_id 1 -> tutor id 739
        try:
            user = User.objects.get(id=739)
        except User.DoesNotExist:
            return Response({"error": "테스트용 유저(id=739)가 없습니다."},
                            status=status.HTTP_404_NOT_FOUND)
        request.user = user
        # --- 임시 코드 끝 ---
        
        # 과외 조회
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"error": "해당 과외가 존재하지 않습니다."},
                            status=status.HTTP_404_NOT_FOUND)

        # 튜터 본인만 수정 가능
        if request.user != course.tutor:
            return Response({"error": "수정 권한이 없습니다."},
                            status=status.HTTP_403_FORBIDDEN)

        # partial=True → 수정할 항목만 받아도 됨
        serializer = CourseDetailSerializer(
            course, data=request.data, partial=True, context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "과외 정보가 성공적으로 수정되었습니다.",
                 "course": serializer.data},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CourseWishToggleView(APIView):
    """
    과외 찜 / 찜해제 토글 API
    """

    def post(self, request, course_id):
        # --- 임시 로그인 코드 ---
        try:
            user = User.objects.get(id=1)
        except User.DoesNotExist:
            return Response({"error": "테스트용 유저(id=1)가 없습니다."},
                            status=status.HTTP_404_NOT_FOUND)
        request.user = user
        # --- 임시 코드 끝 ---

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"error": "해당 과외가 존재하지 않습니다."},
                            status=status.HTTP_404_NOT_FOUND)

        wished = WishedCourses.objects.filter(user=user, course=course)

        if wished.exists():
            wished.delete()
            message = "찜이 해제되었습니다."
            is_wished = False
        else:
            WishedCourses.objects.create(user=user, course=course)
            message = "찜이 추가되었습니다."
            is_wished = True

        return Response(
            {"message": message, 
             "is_wished": is_wished,},
            status=status.HTTP_200_OK
        )
    
class CourseStatusUpdateView(APIView):
    """
    과외 상태 변경 API
    - 과외 상태 업데이트
    - 튜터 본인만 가능
    - 종료 시 수강생이 없어야 함
    """

    def patch(self, request, course_id):
        # --- 임시 로그인 (User id=739) ---
        # course_id 1 -> tutor id 739
        try:
            user = User.objects.get(id=739)
        except User.DoesNotExist:
            return Response({"error": "테스트용 유저(id=739)가 없습니다."},
                            status=status.HTTP_404_NOT_FOUND)
        request.user = user
        # --- 임시 코드 끝 ---

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({"error": "해당 과외가 존재하지 않습니다."},
                            status=status.HTTP_404_NOT_FOUND)

        if request.user != course.tutor:
            return Response({"error": "상태 변경 권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get("status")
        valid_status = [choice[0] for choice in Course.StatusChoices.choices]

        if new_status not in valid_status:
            return Response({"error": "유효하지 않은 상태값입니다."}, status=status.HTTP_400_BAD_REQUEST)

        # 종료 상태로 변경하려면 수강생이 없어야 함
        if new_status == Course.StatusChoices.FINISHED and course.tutees.exists():
            return Response({"error": "수강 중인 튜티가 있어 종료할 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        course.status = new_status
        course.save(update_fields=["status"])

        return Response({
            "message": f"과외 상태가 '{new_status}'로 변경되었습니다.",
            "status": course.status
        }, status=status.HTTP_200_OK)