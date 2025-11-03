from rest_framework.decorators import api_view
from rest_framework.response import Response
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