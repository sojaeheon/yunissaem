from django.urls import path
from .views import CourseDetailView

urlpatterns = [
    path('<int:course_id>/', CourseDetailView.as_view(), name='course-detail'),
]
