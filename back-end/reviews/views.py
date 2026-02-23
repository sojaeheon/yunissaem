from rest_framework import generics, permissions, status
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Review
from .serializers import ReviewCreateSerializer

class ReviewCreateView(generics.CreateAPIView):
    """
    과외 후기(Review) 생성 API
    수강생(Tutee)이 종료된 과외에 대해 리뷰를 작성합니다.
    """
    queryset = Review.objects.all()
    serializer_class = ReviewCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="과외 후기 작성",
        operation_description=(
            "과외가 종료된 후, 수강생이 후기를 작성합니다.\n"
            "- **enrollment**: 수강 등록 ID (본인의 것이어야 함)\n"
            "- **rating**: 별점 (0.5 ~ 5.0)\n"
            "- **comment**: 리뷰 내용\n\n"
            "**실패 케이스:** 본인 수강 내역이 아님 / 과외 미종료 / 이미 리뷰 작성함"
        ),
        request_body=ReviewCreateSerializer,
        responses={
            201: openapi.Response(
                description="후기 작성 성공",
                schema=ReviewCreateSerializer
            ),
            400: openapi.Response(
                description="유효성 검사 실패",
                examples={
                    "application/json": {
                        "non_field_errors": ["본인이 수강한 과외에 대해서만 리뷰를 남길 수 있습니다."],
                        "enrollment": ["이 수강 내역에 대한 리뷰가 이미 존재합니다."]
                    }
                }
            ),
            401: openapi.Response(description="로그인 필요(토큰 없음)")
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)