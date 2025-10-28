from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Course, Category
from .serializers import CourseListSerializer
from django.utils import timezone
from datetime import timedelta

# 인기순으로 정렬 - 단순 조회수/업로드 날짜 기준 최상위 10개
@api_view(['GET'])
def popular_view(request):
    popular_courses = Course.objects.all().order_by('-view_count')[:10]
    serializer = CourseListSerializer(popular_courses, many=True)
    return Response(serializer.data)

# 최신 과외 -> 기준일 이내 과외 생성 일자 빠른 순 10개까지 조회
@api_view(['GET'])
def new_view(request):
    # 최신 기준 며칠 이내로?
    recent_days = 60
    time_threshold = timezone.now() - timedelta(days=recent_days)

    new_courses = Course.objects.filter(created_at__gte=time_threshold).order_by('-created_at')[:10]
    serializer = CourseListSerializer(new_courses, many=True)
    return Response(serializer.data)

# ✅ 카테고리별 과외 목록 조회
@api_view(['GET'])
def course_list_by_category(request, category_id):
    """
    카테고리별 과외 목록을 조회합니다.
    - sort 파라미터: latest (기본), popular, review
    - courses 테이블에 캐싱된 필드(popularity_score, review_count 등)를 활용
    """
    
    try:
        category = Category.objects.get(id=category_id)
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

    # 🔹 해당 카테고리의 활성화된 과외만 조회
    courses = Course.objects.filter(category=category, is_active=True)

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