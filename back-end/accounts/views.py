# users/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from courses.serializers import CourseListSerializer
from accounts.models import Account # User 모델 임포트

# 내가 찜한 과외 및 내가 수강중인 과외 목록 (로그인 기능 없을 때 테스트용)
# 추후 permission_classes도 수정
@api_view(['GET'])
def my_data_view(request):
    """
    임시 테스트용 API: 로그인 기능 구현 전, ID가 1인 유저가
    로그인한 것처럼 가정하고 찜 목록과 수강 목록을 반환합니다.
    """
    # --- 테스트용 임시 코드 ---
    # 실제 로그인 기능이 없으므로, 테스트용 유저를 DB에서 직접 가져옴
    # ※※※실제 배포 시에는 이 코드를 반드시 삭제※※※
    try:
        # ID가 1인 유저를 'testuser'라고 가정
        user = Account.objects.get(id=1)
    except Account.DoesNotExist:
        return Response({"error": "테스트용 유저(id=1)가 DB에 없습니다."}, status=status.HTTP_404_NOT_FOUND)

    # request.user에 강제로 할당하여 마치 로그인된 것처럼 만듭니다.
    request.user = user
    # --- 임시 코드 끝 ---

    # request.user가 실제 Account 객체이므로 is_authenticated는 항상 True입니다.
    wishlist_qs = request.user.wished_courses.all().order_by('-created_at')[:10]
    attending_qs = request.user.attending_courses.all().order_by('-created_at')[:10]

    wishlist_serializer = CourseListSerializer(wishlist_qs, many=True)
    attending_serializer = CourseListSerializer(attending_qs, many=True)

    response_data = {
        'my_wishlist': wishlist_serializer.data,
        'my_attending_courses': attending_serializer.data
    }
    
    return Response(response_data)