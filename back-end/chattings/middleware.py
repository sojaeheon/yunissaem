from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


@database_sync_to_async
def _get_user_from_token(jwt_auth, validated_token):
    return jwt_auth.get_user(validated_token)


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner
        self.jwt_auth = JWTAuthentication()

    async def __call__(self, scope, receive, send):
        # 기본값은 비인증 사용자로 설정한다.
        scope["user"] = AnonymousUser()

        token = self._extract_token(scope)
        if token:
            try:
                validated_token = self.jwt_auth.get_validated_token(token)
                scope["user"] = await _get_user_from_token(self.jwt_auth, validated_token)
            except Exception:
                # 토큰이 없거나 유효하지 않으면 비인증 사용자로 유지한다.
                scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)

    def _extract_token(self, scope):
        # 1) Authorization 헤더(Bearer)에서 토큰을 우선 추출한다.
        for key, value in scope.get("headers", []):
            if key == b"authorization":
                auth_value = value.decode("utf-8", errors="ignore")
                if auth_value.lower().startswith("bearer "):
                    return auth_value.split(" ", 1)[1].strip()

        # 2) 쿼리스트링(token 또는 access)에서도 토큰을 허용한다.
        query_string = scope.get("query_string", b"").decode("utf-8", errors="ignore")
        if query_string:
            query_params = parse_qs(query_string)
            for key in ("token", "access"):
                values = query_params.get(key)
                if values and values[0].strip():
                    return values[0].strip()

        return None


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
