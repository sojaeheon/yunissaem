from django.urls import path, include
from .views import my_data_view

urlpatterns = [
    path('data/', my_data_view),
]
