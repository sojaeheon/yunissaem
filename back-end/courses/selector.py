from django.db.models import QuerySet
from .models import Course
from django.utils import timezone
from datetime import timedelta

def get_popular_courses() -> QuerySet[Course]: 
    """인기 과외 10개를 조회합니다."""
    return Course.objects.all().order_by('-view_count')[:10]

def get_new_courses(days=60) -> QuerySet[Course]:
    """지정한 기간 내에 생성된 신규 과외 10개를 조회합니다."""
    time_threshold = timezone.now() - timedelta(days=days)
    return Course.objects.filter(created_at__gte=time_threshold).order_by('-created_at')[:10]