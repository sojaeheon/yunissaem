from django.urls import path
from .views import ChatRoomCreateAPIView

urlpatterns = [
    path("rooms/", ChatRoomCreateAPIView.as_view(), name="chat-room-create"),
]
