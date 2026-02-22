from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import UserRegisterSerializer, ProfileSerializer, UserDetailSerializer, TutorProfileUpdateSerializer
from .models import User

# =========================================================
# 👤 회원가입 API
# =========================================================
@swagger_auto_schema(
    method="post",
    operation_summary="회원가입",
    operation_description="사용자 회원가입 API",
    request_body=UserRegisterSerializer,
    responses={
        201: openapi.Response(
            description="회원가입 성공",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "message": openapi.Schema(type=openapi.TYPE_STRING),
                    "user": openapi.Schema(type=openapi.TYPE_OBJECT),
                }
            ),
            examples={
                "application/json": {
                    "message": "회원가입 성공",
                    "user": {
                        "id": 1,
                        "username": "testuser",
                        "email": "test@test.com"
                    }
                }
            }
        ),
        400: openapi.Response(description="유효성 검사 실패"),
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserRegisterSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {
                "message": "회원가입 성공",
                "user": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================================================
# 마이페이지 조회 / 수정 API
# =========================================================
class MyPageDetailView(generics.RetrieveUpdateAPIView):
    """
    GET  : 내 프로필 조회 - tutor_intro가 있으면 포함
    PATCH: 내 프로필 수정
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        # GET 요청(조회) 시에는 tutor_intro 유무를 체크하는 UserDetailSerializer 사용
        if self.request.method == 'GET':
            return UserDetailSerializer
        return ProfileSerializer

    def get_object(self):
        # 현재 로그인한 유저만 접근 가능
        return self.request.user

    def get_serializer_context(self):
        # serializer에서 request 접근 가능하도록 전달
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @swagger_auto_schema(
        operation_summary="마이페이지 조회",
        operation_description="현재 로그인한 사용자의 프로필을 조회합니다.",
        responses={200: UserDetailSerializer}   # ProfileSerializer에서 변경
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

# =========================================================
# 튜터 설정 API (본인 경력 수정)
# =========================================================
class MyTutorSettingsView(generics.RetrieveUpdateAPIView):
    """
    GET  : 내 튜터 정보 조회
    PATCH: 내 튜터 정보(tutor_intro) 수정
    """
    serializer_class = TutorProfileUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    @swagger_auto_schema(
        operation_summary="튜터 설정 수정",
        operation_description="본인의 튜터 소개 내용을 수정합니다. 비밀번호 확인이 필요합니다.",
        request_body=TutorProfileUpdateSerializer,
        responses={200: TutorProfileUpdateSerializer}
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
# =========================================================
# 튜터 공개 프로필 API (타인 조회용)
# =========================================================
class TutorPublicDetailView(generics.RetrieveAPIView):
    """
    GET : 특정 유저(튜터)의 공개 프로필 조회
    """
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    @swagger_auto_schema(
        operation_summary="튜터 공개 프로필 조회",
        operation_description="특정 ID를 가진 유저의 공개 프로필을 조회합니다.",
        responses={200: UserDetailSerializer, 401: "인증 정보가 없습니다.", 404: "유저를 찾을 수 없습니다."}
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)