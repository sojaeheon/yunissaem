from django.urls import path, include
from .views import popular_view, new_view,course_list_by_category

urlpatterns = [
    path('popular/', popular_view),
    path('new/', new_view),
    path('category/<int:category_id>',course_list_by_category)
]
