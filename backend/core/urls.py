"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (  # <-- NUEVAS IMPORTACIONES
    TokenRefreshView,
    TokenVerifyView
)
# utilizaremos la vista personalizada que permite email/telefono
from usuarios.views import CustomTokenObtainPairView

from django.http import JsonResponse
from django.db import connection

# [FASE 0] Health check DB (mantener compatibilidad)
def db_keepalive(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return JsonResponse({"status": "ok", "db": "connected"})
    except Exception as e:
        return JsonResponse(
            {"status": "error", "db": "disconnected", "detail": str(e)},
            status=500,
        )

# [FASE 6 §6.4] Health check completo
from .health import health_view


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/db/', db_keepalive),
    path('health/', health_view, name='health'),  # [FASE 6 §6.4]
    
    # Rutas JWT (autenticación)
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Nuestras rutas de la API
    path('api/', include('usuarios.urls')),
    path('api/', include('notificaciones.urls')), 
]

# Servir archivos media en producción
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
