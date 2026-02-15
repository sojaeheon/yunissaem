from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from .models import Course, Enrollment, WishedCourses, Category
from .serializers import CourseDetailSerializer,CourseListSerializer,CourseCreateSerializer,TuteeEnrolledCourseSerializer, TuteeCompletedCourseSerializer, TuteeWishedCourseSerializer, TutorCurrentCourseSerializer, TutorPastCourseSerializer
from .services import complete_expired_enrollments, finish_expired_tutor_courses
from accounts.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny

# 검색 조회 api
@api_view(['GET'])
@permission_classes([AllowAny])
def search_courses(request):
    """
    🔍 과외 검색 API
    - 검색 키워드: ?q=키워드
    - 검색 기준: ?filter=title / content / author
    - 정렬 기준: ?sort=popular / latest / review
    """
    query = request.GET.get('q', '').strip()  # 검색어
    search_filter = request.GET.get('filter', 'all')  # 검색 기준
    sort = request.GET.get('sort', 'latest')  # 정렬 기준 (기본값: 최신순)

    # ✅ 검색어가 비어있을 경우
    if not query:
        return Response({"error": "검색어를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

    # ✅ 검색 조건 (Q 객체로 복수 필드 검색)
    # Q 라이브러리를 활용하여 or, and, not 조건 사용
    # incontains => 대소문자 구분하지 않는 부분 문자열 검색
        # filter() + Q()로 여러 컬럼에서 부분 일치 검색
    if search_filter == 'content':  
        # 제목 + 내용 통합 검색
        courses = Course.objects.filter(
            Q(title__icontains=query) |
            Q(description__icontains=query)
        )

    elif search_filter == 'author':  
        courses = Course.objects.filter(
            Q(tutor__name__icontains=query)
        )


    # ✅ 정렬 조건
    if sort == 'popular':
        courses = courses.order_by('-popularity_score', '-created_at')
    elif sort == 'review':
        courses = courses.order_by('-review_count', '-created_at')
    else:
        courses = courses.order_by('-created_at')

    # ✅ 직렬화 후 반환
    serializer = CourseListSerializer(courses[:30], many=True)
    return Response({
        "query": query,
        "filter": search_filter,
        "sort": sort,
        "total": len(serializer.data),
        "results": serializer.data
    })

# ✅ 카테고리별 과외 목록 조회
@api_view(['GET'])
def course_list_by_category(request, category_id):
    """
    카테고리별 과외 목록을 조회합니다.
    - sort 파라미터: latest (기본), popular, review
    - courses 테이블에 캐싱된 필드(popularity_score, review_count 등)를 활용
    """
    
    try:
        if category_id == 0:
            courses = Course.objects.all()
        else:
            # 🔹 해당 카테고리의 활성화된 과외만 조회
            category = Category.objects.get(id=category_id)
            courses = Course.objects.filter(category=category)
    except Category.DoesNotExist:
        return Response(
            {"error": "해당 카테고리를 찾을 수 없습니다."},
            status=status.HTTP_404_NOT_FOUND
        )

    # 클라이언트에서 URL 쿼리 파라미터로 전달되는 값
    # 예) /api/courses/category/3/?sort=popular
    # 예) /api/courses/category/3/?sort=review
    # 예) /api/courses/category/3/ -> 기본값 'latest'
    # sort값이 없으면 'latest'(최신순)으로 설정됨
    # 🔸 정렬 파라미터 (기본값: latest)
    sort = request.GET.get('sort', 'latest')
    

    # ✅ 정렬 조건 분기
    if sort == 'popular':
        # 🔸 인기순 (가중치 기반 popularity_score 사용)
        courses = courses.order_by('-popularity_score', '-created_at')
    elif sort == 'review':
        # 🔸 리뷰 많은 순 (캐싱된 review_count 사용)
        courses = courses.order_by('-review_count', '-created_at')
    else:
        # 🔸 최신순 (기본)
        courses = courses.order_by('-created_at')

    serializer = CourseListSerializer(courses, many=True)

    return Response({
        "category": category.name,
        "sort": sort,
        "total": len(serializer.data),
        "courses": serializer.data
    })

#####################
# 과외 생성 API
#####################
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course(request):
    serializer = CourseCreateSerializer(data=request.data)

    if serializer.is_valid():
        course = serializer.save()
        return Response({
            "message": "과외가 성공적으로 생성되었습니다.",
            "course_id": course.id
        }, status=201)

    return Response(serializer.errors, status=400)



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

        # 종료 상태로 변경하려면 현재 수강중(enrolled) 튜티가 없어야 함
        has_active_enrollment = Enrollment.objects.filter(
            course=course,
            status=Enrollment.StatusChoices.ENROLLED,
        ).exists()
        if new_status == Course.StatusChoices.FINISHED and has_active_enrollment:
            return Response({"error": "수강 중인 튜티가 있어 종료할 수 없습니다."}, status=status.HTTP_400_BAD_REQUEST)

        course.status = new_status
        course.save(update_fields=["status"])

        return Response({
            "message": f"과외 상태가 '{new_status}'로 변경되었습니다.",
            "status": course.status
        }, status=status.HTTP_200_OK)

# 수강중 과외 목록 조회 API
class EnrolledCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        complete_expired_enrollments(user=request.user)

        enrollments = (
            Enrollment.objects
            .filter(
                user=request.user,
                status=Enrollment.StatusChoices.ENROLLED
            )
            .select_related("course", "course__tutor", 'course__category')
            .order_by("-created_at")
        )

        serializer = TuteeEnrolledCourseSerializer(
            enrollments, 
            many=True,
            context={"request": request}
        )
        return Response(serializer.data)
    
# 수강완료 과외 목록 조회 API
class CompletedCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        complete_expired_enrollments(user=request.user)

        enrollments = (
            Enrollment.objects
            .filter(
                user=request.user,
                status=Enrollment.StatusChoices.COMPLETED,
            )
            .select_related(
                "course",
                "course__tutor",
                "course__category",
            )
            .order_by("-end_date")
        )

        serializer = TuteeCompletedCourseSerializer(
            enrollments,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class CompletedCourseDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, enrollment_id):
        enrollment = Enrollment.objects.filter(
            id=enrollment_id,
            user=request.user,
            status=Enrollment.StatusChoices.COMPLETED,
        ).first()

        if not enrollment:
            return Response(
                {"error": "해당 과외를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TuteeWishedCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wished_courses = (
            WishedCourses.objects
            .filter(user=request.user)
            .select_related("course", "course__tutor", "course__category")
            .order_by("-created_at")
        )

        serializer = TuteeWishedCourseSerializer(
            wished_courses,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class TuteeWishedCourseDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, wish_id):
        wished_course = WishedCourses.objects.filter(
            id=wish_id,
            user=request.user,
        ).first()

        if not wished_course:
            return Response(
                {"error": "해당 과외를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        wished_course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TutorCurrentCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        finish_expired_tutor_courses(tutor=request.user)

        courses = (
            Course.objects
            .filter(
                tutor=request.user,
                status__in=[
                    Course.StatusChoices.RECRUITING,
                    Course.StatusChoices.IN_PROGRESS,
                ],
            )
            .select_related("category")
            .order_by("-created_at")
        )

        serializer = TutorCurrentCourseSerializer(
            courses,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class TutorCurrentCourseDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, course_id):
        course = Course.objects.filter(
            id=course_id,
            tutor=request.user,
            status__in=[
                Course.StatusChoices.RECRUITING,
                Course.StatusChoices.IN_PROGRESS,
            ],
        ).first()

        if not course:
            return Response(
                {"error": "해당 과외를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TutorPastCourseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        finish_expired_tutor_courses(tutor=request.user)

        courses = (
            Course.objects
            .filter(
                tutor=request.user,
                status=Course.StatusChoices.FINISHED,
            )
            .select_related("category")
            .order_by("-created_at")
        )

        serializer = TutorPastCourseSerializer(
            courses,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class TutorPastCourseDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, course_id):
        course = Course.objects.filter(
            id=course_id,
            tutor=request.user,
            status=Course.StatusChoices.FINISHED,
        ).first()

        if not course:
            return Response(
                {"error": "해당 과외를 찾을 수 없습니다."},
                status=status.HTTP_404_NOT_FOUND,
            )

        course.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
