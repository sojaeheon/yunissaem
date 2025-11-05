# users/views.py
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
    """
    임시 테스트용 API: 로그인 기능 구현 전, ID가 1인 유저가 로그인한 것처럼 가정
    """
    # --- 테스트용 임시 코드 ---
    # 실제 로그인 기능이 없으므로, 테스트용 유저를 DB에서 직접 가져옴
    # ※※※실제 배포 시에는 이 코드를 반드시 삭제※※※
    try:
        # ID가 1인 유저를 'testuser'라고 가정
        user = User.objects.get(id=1)
    except User.DoesNotExist:
        return Response({"error": "테스트용 유저(id=1)가 DB에 없습니다."}, status=status.HTTP_404_NOT_FOUND)

    # request.user에 강제로 할당하여 마치 로그인된 것처럼 만듭니다.
    request.user = user
    # --- 임시 코드 끝 ---

    # request.user가 실제 User 객체이므로 is_authenticated는 항상 True입니다.
    wishlist_qs = request.user.wished_courses.all().order_by('-created_at')[:10]
    attending_qs = request.user.attending_courses.all().order_by('-created_at')[:10]

    wishlist_serializer = CourseListSerializer(wishlist_qs, many=True)
    attending_serializer = CourseListSerializer(attending_qs, many=True)

    response_data = {
        'my_wishlist': wishlist_serializer.data,
        'my_attending_courses': attending_serializer.data
    }
    
    # 인기, 신규, 찜, 수강중 과외 
    courses = {
        'popular_courses': get_popular_courses(),
        'new_courses': get_new_courses(60), # 최신 기준일 지정
        'my_wishlist': get_wishlist_courses(user),
        'my_attending_courses': get_attending_courses(user),
    }

    response_data = {key: CourseListSerializer(value, many=True).data for key, value in courses.items()}

    return Response(response_data)