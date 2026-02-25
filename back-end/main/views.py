# main/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from courses.serializers import CourseListSerializer
from courses.models import Course
from accounts.models import User
from accounts.selector import get_wishlist_courses, get_attending_courses
from courses.selector import get_new_courses, get_popular_courses

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


# =========================================================
# 🏠 홈 화면 데이터 조회 API
# =========================================================
@swagger_auto_schema(
    method='get',
    operation_summary="홈 화면 데이터 조회",
    operation_description="인기 과외, 신규 과외, 찜한 과외, 수강 중 과외 목록을 반환합니다.",
    manual_parameters=[
        openapi.Parameter(
            'user_id',
            openapi.IN_QUERY,
            description="(테스트용) 사용자 ID",
            type=openapi.TYPE_INTEGER,
            required=False
        )
    ],
    responses={
        200: openapi.Response(
            description="홈 화면 데이터",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'popular_courses': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_OBJECT)
                    ),
                    'new_courses': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_OBJECT)
                    ),
                    'my_wishlist': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_OBJECT)
                    ),
                    'my_attending_courses': openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Items(type=openapi.TYPE_OBJECT)
                    ),
                }
            )
        )
    }
)
@api_view(['GET'])
def home_view(request):
    """
    🏠 홈 화면 API
    - 인기 / 신규 / 찜 / 수강 중 과외 목록 제공
    - 비로그인 상태에서도 조회 가능
    - 테스트용으로 ?user_id=값 지원 (배포 시 제거 예정)
    """

    user = request.user

    # ⚠️ 테스트용 임시 로직
    if not user.is_authenticated and request.query_params.get('user_id'):
        try:
            user = User.objects.get(id=request.query_params.get('user_id'))
        except (User.DoesNotExist, ValueError):
            user = None

    if user and user.is_authenticated:
        my_wishlist = get_wishlist_courses(user, limit=10)
        my_attending_courses = get_attending_courses(user, limit=10)
    else:
        my_wishlist = Course.objects.none()
        my_attending_courses = Course.objects.none()

    courses = {
        'popular_courses': get_popular_courses(limit=10),
        'new_courses': get_new_courses(days=60, limit=10),
        'my_wishlist': my_wishlist,
        'my_attending_courses': my_attending_courses,
    }

    response_data = {
        key: CourseListSerializer(value, many=True).data
        for key, value in courses.items()
    }

    return Response(response_data, status=status.HTTP_200_OK)
