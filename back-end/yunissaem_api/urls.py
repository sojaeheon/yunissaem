from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('courses/', include('courses.urls')),
    path('my/', include('accounts.urls')),
    path('home/', include('main.urls')),
]

# 기본 이미지(static/default.jpg)와 업로드 이미지(media/tumbnails/)를 구분
# 프론트에서 thumbnail_image_url로 바로 접근 가능
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)