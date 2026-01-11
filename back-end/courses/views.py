from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from rest_framework import status
from .models import Course, WishedCourses, Category
from .serializers import (
    CourseDetailSerializer,
    CourseListSerializer,
    CourseCreateSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


# =========================================================
# 🔍 과외 검색 API
# =========================================================
@swagger_auto_schema(
    method='get',
    operation_summary="과외 검색",
    operation_description="키워드 기반 과외 검색 API",
    manual_parameters=[
        openapi.Parameter('q', openapi.IN_QUERY, description="검색어", type=openapi.TYPE_STRING, required=True),
        openapi.Parameter('filter', openapi.IN_QUERY, description="검색 기준 (content | author)", type=openapi.TYPE_STRING),
        openapi.Parameter('sort', openapi.IN_QUERY, description="정렬 기준 (latest | popular | review)", type=openapi.TYPE_STRING),
    ],
    responses={200: CourseListSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def search_courses(request):
    query = request.GET.get('q', '').strip()
    search_filter = request.GET.get('filter', 'all')
    sort = request.GET.get('sort', 'latest')

    if not query:
        return Response({"error": "검색어를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

    if search_filter == 'content':
        courses = Course.objects.filter(Q(title__icontains=query) | Q(description__icontains=query))
    elif search_filter == 'author':
        courses = Course.objects.filter(Q(tutor__name__icontains=query))
    else:
        courses = Course.objects.all()

    if sort == 'popular':
        courses = courses.order_by('-popularity_score', '-created_at')
    elif sort == 'review':
        courses = courses.order_by('-review_count', '-created_at')
    else:
        courses = courses.order_by('-created_at')

    serializer = CourseListSerializer(courses[:30], many=True)
    return Response({
        "query": query,
        "filter": search_filter,
        "sort": sort,
        "total": len(serializer.data),
        "results": serializer.data
    })


# =========================================================
# 📂 카테고리별 과외 목록 조회 API
# =========================================================
@swagger_auto_schema(
    method='get',
    operation_summary="카테고리별 과외 목록 조회",
    manual_parameters=[
        openapi.Parameter('sort', openapi.IN_QUERY, description="정렬 기준", type=openapi.TYPE_STRING)
    ],
    responses={200: CourseListSerializer(many=True)}
)
@api_view(['GET'])
def course_list_by_category(request, category_id):
    try:
        if category_id == 0:
            courses = Course.objects.all()
            category_name = "전체"
        else:
            category = Category.objects.get(id=category_id)
            courses = Course.objects.filter(category=category)
            category_name = category.name
    except Category.DoesNotExist:
        return Response({"error": "해당 카테고리를 찾을 수 없습니다."}, status=status.HTTP_404_NOT_FOUND)

    sort = request.GET.get('sort', 'latest')

    if sort == 'popular':
        courses = courses.order_by('-popularity_score', '-created_at')
    elif sort == 'review':
        courses = courses.order_by('-review_count', '-created_at')
    else:
        courses = courses.order_by('-created_at')

    serializer = CourseListSerializer(courses, many=True)
    return Response({
        "category": category_name,
        "sort": sort,
        "total": len(serializer.data),
        "courses": serializer.data
    })


# =========================================================
# ➕ 과외 생성 API
# =========================================================
@swagger_auto_schema(
    method='post',
    operation_summary="과외 생성",
    request_body=CourseCreateSerializer,
    responses={201: "Created"}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course(request):
    serializer = CourseCreateSerializer(data=request.data)
    if serializer.is_valid():
        course = serializer.save()
        return Response(
            {"message": "과외가 성공적으로 생성되었습니다.", "course_id": course.id},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================================================
# 📘 과외 상세 조회 / 수정 API
# =========================================================
class CourseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="과외 상세 조회",
        responses={200: CourseDetailSerializer}
    )
    def get(self, request, course_id):
        course = Course.objects.filter(id=course_id).first()
        if not course:
            return Response({"error": "해당 과외가 존재하지 않습니다."}, status=status.HTTP_404_NOT_FOUND)

        course.view_count += 1
        course.save(update_fields=["view_count"])

        serializer = CourseDetailSerializer(course, context={"request": request})
        return Response(serializer.data)

    @swagger_auto_schema(
        operation_summary="과외 수정",
        request_body=CourseDetailSerializer,
        responses={200: CourseDetailSerializer}
    )
    def patch(self, request, course_id):
        course = Course.objects.filter(id=course_id).first()
        if not course:
            return Response({"error": "해당 과외가 존재하지 않습니다."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != course.tutor:
            return Response({"error": "수정 권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CourseDetailSerializer(course, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "과외 정보가 수정되었습니다.", "course": serializer.data})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================================================
# ❤️ 과외 찜 / 찜 해제 API
# =========================================================
class CourseWishToggleView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(operation_summary="과외 찜 / 찜 해제")
    def post(self, request, course_id):
        course = Course.objects.filter(id=course_id).first()
        if not course:
            return Response({"error": "해당 과외가 존재하지 않습니다."}, status=status.HTTP_404_NOT_FOUND)

        wished = WishedCourses.objects.filter(user=request.user, course=course)
        if wished.exists():
            wished.delete()
            return Response({"message": "찜이 해제되었습니다.", "is_wished": False})

        WishedCourses.objects.create(user=request.user, course=course)
        return Response({"message": "찜이 추가되었습니다.", "is_wished": True})


# =========================================================
# 🔄 과외 상태 변경 API
# =========================================================
class CourseStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="과외 상태 변경",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={'status': openapi.Schema(type=openapi.TYPE_STRING)},
            required=['status']
        )
    )
    def patch(self, request, course_id):
        course = Course.objects.filter(id=course_id).first()
        if not course:
            return Response({"error": "해당 과외가 존재하지 않습니다."}, status=status.HTTP_404_NOT_FOUND)

        if request.user != course.tutor:
            return Response({"error": "상태 변경 권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)

        course.status = request.data.get("status")
        course.save(update_fields=["status"])

        return Response({"message": "과외 상태가 변경되었습니다.", "status": course.status})
