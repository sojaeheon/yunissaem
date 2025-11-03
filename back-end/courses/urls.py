from django.urls import path, include
from .views import popular_view, new_view

urlpatterns = [
    path('popular/', popular_view),
    path('new/', new_view)
]
