"""
Vistas de enfermeras: ViewSet + perfil personal + endpoint público.
"""
import logging

from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import Enfermera
from ..serializers import EnfermeraSerializer, DoctorSerializer
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class EnfermeraViewSet(viewsets.ModelViewSet):
    queryset = Enfermera.objects.all()
    serializer_class = EnfermeraSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        """Al crear una enfermera, notificar a administradores."""
        enfermera = serializer.save()

        try:
            ServicioNotificaciones.notificar_usuario_registrado(enfermera.usuario)
        except Exception as e:
            logger.exception('Error enviando notificación de enfermera registrada: %s', e)

        return enfermera


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def especialistas_publicos(request):
    """Endpoint público para ver especialistas activos (doctores y enfermeras)."""
    from ..models import Doctor
    doctores = Doctor.objects.select_related('usuario', 'especialidad').all()
    doctores_data = DoctorSerializer(doctores, many=True, context={'request': request}).data

    enfermeras = Enfermera.objects.select_related('usuario', 'especialidad').all()
    enfermeras_data = EnfermeraSerializer(enfermeras, many=True, context={'request': request}).data

    especialistas = []
    for doctor in doctores_data:
        doctor['tipo'] = 'doctor'
        especialistas.append(doctor)

    for enfermera in enfermeras_data:
        enfermera['tipo'] = 'nurse'
        especialistas.append(enfermera)

    return Response(especialistas)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def mi_perfil_enfermera(request):
    """
    Endpoint para que una enfermera vea y edite su propio perfil.
    GET: obtener perfil.
    PUT/PATCH: actualizar perfil.
    """
    from django.shortcuts import get_object_or_404
    from rest_framework import status

    enfermera = get_object_or_404(Enfermera, usuario=request.user)

    if request.method == 'GET':
        serializer = EnfermeraSerializer(enfermera)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        # Solo permitir actualizar campos específicos del perfil
        data_permitida = {
            'especialidad': request.data.get('especialidad'),
            'otra_especialidad': request.data.get('otra_especialidad', ''),
            'numero_licencia': request.data.get('numero_licencia', '')
        }

        # Permitir actualizar datos del usuario también
        if 'first_name' in request.data:
            enfermera.usuario.first_name = request.data['first_name']
        if 'last_name' in request.data:
            enfermera.usuario.last_name = request.data['last_name']
        if 'email' in request.data:
            enfermera.usuario.email = request.data['email']
        if 'telefono' in request.data:
            enfermera.usuario.telefono = request.data['telefono']

        enfermera.usuario.save()

        # Actualizar perfil de enfermera
        serializer = EnfermeraSerializer(enfermera, data=data_permitida, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
