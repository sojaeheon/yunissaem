from django.urls import path
from .views import CourseDetailView, CourseWishToggleView, CourseStatusUpdateView

urlpatterns = [
    path('<int:course_id>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:course_id>/wish/', CourseWishToggleView.as_view(), name='course-like-toggle'),
    path('<int:course_id>/status/', CourseStatusUpdateView.as_view(), name='course-status-update'),
]
