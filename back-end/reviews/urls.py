from django.urls import path
from .views import ReviewCreateView

app_name = 'reviews'

urlpatterns = [
    # POST /reviews/ : 후기 작성
    path('', ReviewCreateView.as_view(), name='review-create'),
]