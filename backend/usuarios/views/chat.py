"""
Vistas del asistente de IA: ChatIA y Sugerencias.
"""
import logging

from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework import status

from ..models import Paciente

logger = logging.getLogger(__name__)


class _UserRateThrottle(UserRateThrottle):
    pass


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([UserRateThrottle])
def chat_ia(request):
    """
    Endpoint para el asistente de IA de agendamiento de citas.
    Los pacientes usan su propio perfil.
    Los admins y doctores deben especificar paciente_id.
    """
    from ..ai_service import procesar_chat

    mensaje = request.data.get('mensaje', '').strip()
    paciente_id = request.data.get('paciente_id')

    if not mensaje:
        return Response(
            {'error': 'El mensaje no puede estar vacío'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(mensaje) > 500:
        return Response(
            {'error': 'El mensaje no puede exceder 500 caracteres'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Determinar el paciente
    if request.user.rol == 'patient':
        # Pacientes usan su propio perfil
        paciente = Paciente.objects.filter(usuario=request.user).first()
        if not paciente:
            logger.warning(f"Paciente sin perfil: {request.user.username}")
            return Response(
                {'error': 'Tu cuenta no está registrada correctamente como paciente.'},
                status=status.HTTP_403_FORBIDDEN
            )
    elif request.user.rol in ['admin', 'doctor']:
        # Admins y doctores deben especificar paciente_id
        if not paciente_id:
            return Response(
                {'error': 'Debes especificar paciente_id para usar el chat como admin o doctor.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            paciente_id = int(paciente_id)
            paciente = Paciente.objects.get(id=paciente_id)
        except (ValueError, Paciente.DoesNotExist):
            return Response(
                {'error': 'Paciente no encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        return Response(
            {'error': 'No tienes permiso para usar esta función.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Procesar mensaje
    logger.debug(f"Chat request - Usuario: {request.user.username} ({request.user.rol}), Paciente ID: {paciente.id}")
    respuesta = procesar_chat(paciente.id, mensaje)

    return Response({
        'respuesta': respuesta
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@throttle_classes([UserRateThrottle])
def chat_ia_sugerencias(request):
    """
    Endpoint para obtener sugerencias según el contexto.
    """
    from ..ai_service import obtener_servicio

    paciente = Paciente.objects.filter(usuario=request.user).first()

    if not paciente:
        return Response({'sugerencias': []})

    servicio = obtener_servicio(paciente.id)
    sugerencias = servicio.obtener_sugerencias() if servicio else []

    return Response({'sugerencias': sugerencias})
