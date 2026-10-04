"""
Vistas de imágenes del sitio promocional: ViewSet.
"""
import logging

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import SitioImagen
from ..serializers import SitioImagenSerializer
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class SitioImagenViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar imágenes del sitio promocional."""
    queryset = SitioImagen.objects.all()
    serializer_class = SitioImagenSerializer

    def perform_create(self, serializer):
        imagen = serializer.save()
        try:
            ServicioNotificaciones.notificar_cambios_imagenes_sitio('añadida', imagen.titulo or 'imagen')
        except Exception as e:
            logger.exception('Error enviando notificación de imagen añadida: %s', e)

    def perform_update(self, serializer):
        imagen = serializer.save()
        try:
            ServicioNotificaciones.notificar_cambios_imagenes_sitio('actualizada', imagen.titulo or 'imagen')
        except Exception as e:
            logger.exception('Error enviando notificación de imagen actualizada: %s', e)

    def perform_destroy(self, instance):
        titulo = instance.titulo or 'imagen'
        instance.delete()
        try:
            ServicioNotificaciones.notificar_cambios_imagenes_sitio('eliminada', titulo)
        except Exception as e:
            logger.exception('Error enviando notificación de imagen eliminada: %s', e)

    def get_permissions(self):
        # Permitir acceso público a acciones de lectura sin autenticación
        if self.action in ['list', 'retrieve', 'carousel', 'hero']:
            return [AllowAny()]
        # También permitir si es una URL de acción personalizada sin autenticación
        if not self.request.user or not self.request.user.is_authenticated:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = SitioImagen.objects.all()
        tipo = self.request.query_params.get('tipo')
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        activo = self.request.query_params.get('activo')
        if activo is not None:
            queryset = queryset.filter(activo=activo.lower() == 'true')
        return queryset

    @action(detail=False, methods=['get'])
    def carousel(self, request):
        """Obtener imágenes del carrusel."""
        imagenes = self.get_queryset().filter(tipo='carousel', activo=True).order_by('orden', '-fecha_creacion')
        serializer = self.get_serializer(imagenes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def hero(self, request):
        """Obtener imagen hero."""
        imagen = self.get_queryset().filter(tipo='hero', activo=True).first()
        if imagen:
            serializer = self.get_serializer(imagen)
            return Response(serializer.data)
        return Response({})
