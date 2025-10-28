from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from .models import Course
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


# 검색 조회 api
@api_view(['GET'])
def search_courses(request):
    """
    🔍 과외 검색 API
    - 검색 키워드: ?q=키워드
    - 정렬 파라미터: ?sort=popular / latest / review
    """
    query = request.GET.get('q', '').strip()  # 검색어
    sort = request.GET.get('sort', 'latest')  # 정렬 기준 (기본값: 최신순)

    # ✅ 검색어가 비어있을 경우
    if not query:
        return Response({"error": "검색어를 입력해주세요."}, status=status.HTTP_400_BAD_REQUEST)

    # ✅ 검색 조건 (Q 객체로 복수 필드 검색)
    # Q 라이브러리를 활용하여 or, and, not 조건 사용
    courses = Course.objects.filter(
        Q(title__icontains=query) |
        Q(description__icontains=query) |
        Q(tutor__name__icontains=query) |
        Q(category__name__icontains=query),
        is_active=True
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
        "sort": sort,
        "total": len(serializer.data),
        "results": serializer.data
    })