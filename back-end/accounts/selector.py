from django.db.models import QuerySet
from .models import Account
from courses.models import Course 

def get_wishlist_courses(user: Account) -> QuerySet[Course]:
    """
    특정 유저가 찜한 과외 목록을 최신순으로 10개 조회합니다.
    """
    return user.wished_courses.all().order_by('-created_at')[:10]


def get_attending_courses(user: Account) -> QuerySet[Course]:
    """
    특정 유저가 수강 중인 과외 목록을 최신순으로 10개 조회합니다.
    """
    return user.attending_courses.all().order_by('-created_at')[:10]    
