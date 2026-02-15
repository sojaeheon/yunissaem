from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import UserRegisterSerializer, ProfileSerializer


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
# 🙋 마이페이지 조회 / 수정 API
# =========================================================
class MyPageDetailView(generics.RetrieveUpdateAPIView):
    """
    GET  : 내 프로필 조회
    PATCH: 내 프로필 수정
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

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
        responses={200: ProfileSerializer}
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary="마이페이지 수정",
        operation_description="현재 로그인한 사용자의 프로필을 수정합니다.",
        request_body=ProfileSerializer,
        responses={200: ProfileSerializer}
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
