from django.urls import path, include
from .views import my_data_view

urlpatterns = [
    path('', my_data_view),
]
