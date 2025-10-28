from django.urls import path, include
from .views import popular_view, new_view,course_list_by_category,search_courses

urlpatterns = [
    path('popular/', popular_view),
    path('new/', new_view),
    path('categoris/<int:category_id>',course_list_by_category),
    path('courses/search/',search_courses)
]
