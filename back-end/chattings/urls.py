from django.urls import path

from .views import (
    ChatRoomCreateAPIView,
    ChatRoomListAPIView,
    ChatRoomReadAPIView,
    MessageListAPIView,
)

urlpatterns = [
    # 채팅방 생성 (또는 기존 방 반환)
    path("rooms/", ChatRoomCreateAPIView.as_view(), name="chat-room-create"),

    # 채팅방 목록 조회
    path("rooms/list/", ChatRoomListAPIView.as_view(), name="chat-room-list"),

    # 채팅방 메시지 히스토리
    path("rooms/<int:room_id>/messages/", MessageListAPIView.as_view(), name="chat-message-list"),

    # 채팅방 읽음 처리
    path("rooms/<int:room_id>/read/", ChatRoomReadAPIView.as_view(), name="chat-room-read"),
]