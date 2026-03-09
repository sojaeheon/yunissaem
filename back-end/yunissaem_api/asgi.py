import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yunissaem_api.settings')

# Django 앱 레지스트리를 먼저 초기화한 뒤 라우팅을 가져온다.
django_asgi_app = get_asgi_application()
from chattings.routing import websocket_urlpatterns
from chattings.middleware import JWTAuthMiddlewareStack

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    # WebSocket은 JWT 인증 미들웨어를 사용한다.
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})
