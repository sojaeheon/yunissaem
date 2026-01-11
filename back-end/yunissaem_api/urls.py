from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include


from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Yunissaem API",
        default_version='v1',
        description="유니쌤 백엔드 API 명세서",
        contact=openapi.Contact(email="sojaeheon123@gmail.com"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [

    # API
    path('admin/', admin.site.urls),
    path('courses/', include('courses.urls')),
    path('my/', include('accounts.urls')),
    path('home/', include('main.urls')),
    path("chat/", include("chattings.urls")),

    # Swagger API 문서
    path(
        'swagger/',
        schema_view.with_ui('swagger', cache_timeout=0),
        name='schema-swagger-ui'
    ),
    path(
        'redoc/',
        schema_view.with_ui('redoc', cache_timeout=0),
        name='schema-redoc'
    ),
]

# 기본 이미지(static/default.jpg)와 업로드 이미지(media/tumbnails/)를 구분
# 프론트에서 thumbnail_image_url로 바로 접근 가능
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)