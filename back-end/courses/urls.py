from django.urls import path
from .views import CompletedCourseDeleteView, CompletedCourseListView, CourseDetailView, CourseWishToggleView, CourseStatusUpdateView, TuteeWishedCourseDeleteView, TuteeWishedCourseListView, course_list_by_category, search_courses, create_course, EnrolledCourseListView

urlpatterns = [
    path('<int:course_id>/', CourseDetailView.as_view(), name='course-detail'),
    path('<int:course_id>/wish/', CourseWishToggleView.as_view(), name='course-like-toggle'),
    path('<int:course_id>/status/', CourseStatusUpdateView.as_view(), name='course-status-update'),
    path('category/<int:category_id>/',course_list_by_category),
    path('search/',search_courses),
    path('create/',create_course, name='course-create'),
    path('enrolled/', EnrolledCourseListView.as_view(), name='enrolled-course-list'),
    path('completed/', CompletedCourseListView.as_view(), name='completed-course-list'),
    path('completed/<int:enrollment_id>/', CompletedCourseDeleteView.as_view(), name='completed-course-delete'),
    path('wished/', TuteeWishedCourseListView.as_view(), name='wished-course-list'),
    path('wished/<int:wish_id>/', TuteeWishedCourseDeleteView.as_view(), name='wished-course-delete'),
]
