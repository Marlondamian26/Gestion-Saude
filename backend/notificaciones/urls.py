from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .sse import NotificacionesSSEView

router = DefaultRouter()
router.register(r'notificaciones', views.NotificacionViewSet, basename='notificacion')

urlpatterns = [
    path('', include(router.urls)),
    path('notificaciones/stream/', NotificacionesSSEView.as_view(), name='notificaciones-stream'),
]