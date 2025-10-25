from django.db.models import QuerySet
from .models import Account
from courses.models import Course 

def get_wishlist_courses(user: Account, limit: int | None = None) -> QuerySet[Course]:
    """
    특정 유저가 찜한 과외 목록을 최신순으로 조회합니다.
    limit이 지정되면 해당 개수만큼, 지정하지 않으면 전부 반환합니다.
    """
    qs = user.wished_courses.all().order_by('-created_at')
    if limit is not None:
        qs = qs[:limit]
    return qs


def get_attending_courses(user: Account, limit: int | None = None) -> QuerySet[Course]:
    """
    특정 유저가 수강 중인 과외 목록을 최신순으로 조회합니다.
    limit이 지정되면 해당 개수만큼, 지정하지 않으면 전부 반환합니다.
    """
    qs = user.attending_courses.all().order_by('-created_at')
    if limit is not None:
        qs = qs[:limit]
    return qs