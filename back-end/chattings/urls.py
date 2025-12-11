from django.urls import path
from .views import ChatRoomCreateAPIView, ChatRoomReadAPIView

urlpatterns = [
    path("rooms/", ChatRoomCreateAPIView.as_view(), name="chat-room-create"),
    path("rooms/<int:room_id>/", ChatRoomReadAPIView.as_view(), name="chat-room-read"),
]
