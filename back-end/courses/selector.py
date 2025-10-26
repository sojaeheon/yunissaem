from django.db.models import QuerySet
from .models import Course
from django.utils import timezone
from datetime import timedelta

def get_popular_courses(limit: int | None = None) -> QuerySet[Course]:
    """
    인기 과외를 조회합니다.
    limit이 지정되면 해당 개수만큼, 지정하지 않으면 전부 반환합니다.
    """
    qs = Course.objects.all().order_by('-view_count')
    if limit is not None:
        qs = qs[:limit]
    return qs


def get_new_courses(days: int | None = None, limit: int | None = None) -> QuerySet[Course]:
    """
    지정한 기간 내에 생성된 신규 과외를 조회합니다.

    - days: 몇 일 이내 생성된 과외를 볼지 지정 (기본 None → 전체 과외)
    - limit: 몇 개만 조회할지 지정 (기본 None → 전부 조회)
    """
    # 전체 과외를 최신순으로 정렬
    qs = Course.objects.all().order_by('-created_at')

    # 기간 필터 적용
    if days is not None:
        time_threshold = timezone.now() - timedelta(days=days)
        qs = qs.filter(created_at__gte=time_threshold)

    # 개수 제한 적용
    if limit is not None:
        qs = qs[:limit]

    return qs