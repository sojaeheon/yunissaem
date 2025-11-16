from django.urls import path
from .views import CourseDetailView, CourseWishToggleView, CourseStatusUpdateView, course_list_by_category, search_courses

urlpatterns = [
    path('<int:course_id>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:course_id>/wish/', CourseWishToggleView.as_view(), name='course-like-toggle'),
    path('<int:course_id>/status/', CourseStatusUpdateView.as_view(), name='course-status-update'),
    path('category/<int:category_id>',course_list_by_category),
    path('search/',search_courses)
]
