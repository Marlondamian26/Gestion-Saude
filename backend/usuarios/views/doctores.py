"""
Vistas de doctores: ViewSet + perfil personal + endpoint público.
"""
import logging

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import Doctor
from ..serializers import DoctorSerializer
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        """Al crear un doctor, notificar a administradores."""
        doctor = serializer.save()

        try:
            ServicioNotificaciones.notificar_usuario_registrado(doctor.usuario)
        except Exception as e:
            logger.exception('Error enviando notificación de doctor registrado: %s', e)

        return doctor


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctores_publicos(request):
    """Endpoint público para ver doctores activos."""
    from django.core.cache import cache

    # Try cache first
    cache_key = 'doctores_publicos'
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        return Response(cached_data)

    # Optimizado con select_related para evitar N+1 queries
    doctores = Doctor.objects.select_related('usuario', 'especialidad').all()
    serializer = DoctorSerializer(doctores, many=True)
    data = serializer.data

    # Cache por 5 minutos
    cache.set(cache_key, data, 300)

    return Response(data)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def mi_perfil_doctor(request):
    """
    Endpoint para que un doctor vea y edite su propio perfil.
    GET: obtener perfil.
    PUT/PATCH: actualizar perfil.
    """
    from django.shortcuts import get_object_or_404
    from django.contrib.auth import get_user_model
    from rest_framework import status

    Usuario = get_user_model()
    doctor = get_object_or_404(Doctor, usuario=request.user)

    if request.method == 'GET':
        serializer = DoctorSerializer(doctor)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        # Solo permitir actualizar campos específicos del perfil
        data_permitida = {
            'especialidad': request.data.get('especialidad'),
            'otra_especialidad': request.data.get('otra_especialidad', ''),
            'biografia': request.data.get('biografia', '')
        }

        # Permitir actualizar datos del usuario también
        if 'first_name' in request.data:
            doctor.usuario.first_name = request.data['first_name']
        if 'last_name' in request.data:
            doctor.usuario.last_name = request.data['last_name']
        if 'email' in request.data:
            doctor.usuario.email = request.data['email']
        if 'telefono' in request.data:
            doctor.usuario.telefono = request.data['telefono']

        doctor.usuario.save()

        # Actualizar perfil del doctor
        serializer = DoctorSerializer(doctor, data=data_permitida, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
