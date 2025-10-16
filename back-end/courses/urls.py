from django.urls import path, include
from .views import popular_view

urlpatterns = [
    path('popular/', popular_view)
]
