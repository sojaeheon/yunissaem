import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

import chattings.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yunissaem_api.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # 기존 REST API 처리
    "websocket": AuthMiddlewareStack(  # WebSocket 요청 처리
        URLRouter(
            chattings.routing.websocket_urlpatterns
        )
    ),
})
