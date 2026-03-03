from django.urls import path
from .views import ReviewCreateView, ReviewDetailView

app_name = 'reviews'

urlpatterns = [
    # POST /reviews/ : 후기 작성
    path('', ReviewCreateView.as_view(), name='review-create'),
    path('<int:id>/', ReviewDetailView.as_view(), name='review-detail'), # 이 줄 추가!
]