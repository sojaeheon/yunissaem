from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Course
from .serializers import CourseListSerializer

# 인기순으로 정렬 - 단순 조회수/업로드 날짜 기준 최상위 10개
@api_view(['GET'])
def popular_view(request):
    popular_courses = Course.objects.all().order_by('-view_count')[:10]
    serializer = CourseListSerializer(popular_courses, many=True)
    return Response(serializer.data)