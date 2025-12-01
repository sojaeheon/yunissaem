# main/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from courses.serializers import CourseListSerializer
from accounts.models import User # User 모델 임포트
from accounts.selector import get_wishlist_courses, get_attending_courses
from courses.selector import get_new_courses, get_popular_courses


# 홈화면 (로그인 기능 없을 때 테스트용)
# 추후 permission_classes도 수정
@api_view(['GET'])
def home_view(request):

    user = request.user

    # [테스트용 로직] 토큰은 없지만, 개발자가 강제로 보고 싶을 때 (?user_id=1)
    # 실제 배포 시에는 제거하거나 주석 처리
    if not user.is_authenticated and request.query_params.get('user_id'):
        try:
            test_user_id = request.query_params.get('user_id')
            user = User.objects.get(id=test_user_id)
        except (User.DoesNotExist, ValueError):
            pass # 유저 못 찾으면 그냥 비로그인 상태로 유지

    # 인기, 신규, 찜, 수강중 과외 
    courses = {
        'popular_courses': get_popular_courses(limit=10), # 인기 과외 10개
        'new_courses': get_new_courses(days=60, limit=10), # 신규 과외 10개 # 최신 기준일 지정(60일로 테스트)
        'my_wishlist': get_wishlist_courses(user, limit=10), # 찜한 과외 10개
        'my_attending_courses': get_attending_courses(user, limit=10), # 수강중 과외 10개
    }

    response_data = {
        key: CourseListSerializer(value, many=True).data 
        for key, value in courses.items()
    }

    return Response(response_data, status=status.HTTP_200_OK)