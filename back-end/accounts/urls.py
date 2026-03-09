# {backend}/my/
from django.urls import path, include
# from .views import home_view, 
from .views import register_view, MyPageDetailView, TutorPublicDetailView, MyTutorProfileDetailView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.permissions import AllowAny

urlpatterns = [
    # path('home/', home_view),
    path('signup/', register_view),
    path('login/', TokenObtainPairView.as_view(permission_classes=[AllowAny]), name='token_obtain_pair'),
    # 토큰 재발급 역시 로그인이 풀린 상태(401)에서 요청하므로 풀어줌
    path('token/refresh/', TokenRefreshView.as_view(permission_classes=[AllowAny]), name='token_refresh'),
    path('mypage/', MyPageDetailView.as_view(), name='my-page'),
    # 튜터 소개 페이지
    path('tutor/<int:id>/', TutorPublicDetailView.as_view(), name='tutor-public-detail'),
    # 튜터 전용 관리 목록 - 
    path('tutor/settings/', MyTutorProfileDetailView.as_view(), name='tutor-settings'),
]
