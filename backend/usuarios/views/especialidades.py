"""
Vistas de especialidades: ViewSet + endpoint público.
"""
import logging

from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import Especialidad
from ..serializers import EspecialidadSerializer
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class EspecialidadViewSet(viewsets.ModelViewSet):
    queryset = Especialidad.objects.all()
    serializer_class = EspecialidadSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        especialidad = serializer.save()
        try:
            ServicioNotificaciones.notificar_cambios_especialidades('creada', especialidad.nombre)
        except Exception as e:
            logger.exception('Error enviando notificación de especialidad creada: %s', e)

    def perform_update(self, serializer):
        especialidad = serializer.save()
        try:
            ServicioNotificaciones.notificar_cambios_especialidades('actualizada', especialidad.nombre)
        except Exception as e:
            logger.exception('Error enviando notificación de especialidad actualizada: %s', e)

    @action(detail=False, methods=['get'])
    def medicas(self, request):
        """Filtrar solo especialidades médicas."""
        especialidades = self.queryset.filter(tipo_especialidad='medica', activo=True)
        serializer = self.get_serializer(especialidades, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def enfermeria(self, request):
        """Filtrar solo especialidades de enfermería."""
        especialidades = self.queryset.filter(tipo_especialidad__in=['enfermeria', 'ambas'], activo=True)
        serializer = self.get_serializer(especialidades, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def especialidades_publicas(request):
    """Endpoint público para ver especialidades activas."""
    from django.core.cache import cache

    # Try cache first
    cache_key = 'especialidades_activas'
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return Response(cached_data)

    especialidades = Especialidad.objects.filter(activo=True)
    serializer = EspecialidadSerializer(especialidades, many=True)
    data = serializer.data

    # Cache por 5 minutos
    cache.set(cache_key, data, 300)

    return Response(data)
