"""
Vistas de citas: ViewSet + endpoint mis-citas.
"""
import logging

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import Cita, Paciente, Doctor, Enfermera
from ..serializers import CitaSerializer
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all().order_by('-fecha', '-hora')
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Cita.objects.all().order_by('-fecha', '-hora')

        paciente_id = self.request.query_params.get('paciente')
        doctor_id = self.request.query_params.get('doctor')
        if paciente_id:
            queryset = queryset.filter(paciente_id=paciente_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        if user.rol == 'paciente':
            try:
                paciente = Paciente.objects.get(usuario=user)
                return queryset.filter(paciente=paciente)
            except Paciente.DoesNotExist:
                return Cita.objects.none()
        elif user.rol in ['doctor', 'enfermera']:
            try:
                if user.rol == 'doctor':
                    perfil = Doctor.objects.get(usuario=user)
                else:
                    perfil = Enfermera.objects.get(usuario=user)
                return queryset.filter(doctor=perfil)
            except (Doctor.DoesNotExist, Enfermera.DoesNotExist):
                return Cita.objects.none()
        return queryset

    def create(self, request, *args, **kwargs):
        user = request.user
        data = request.data.copy()

        if user.rol == 'patient':
            try:
                paciente = Paciente.objects.get(usuario=user)
            except Paciente.DoesNotExist:
                return Response({'error': 'No tienes perfil de paciente'}, status=400)
            data['paciente'] = paciente.id
        else:
            paciente_id = data.get('paciente')
            if not paciente_id:
                return Response({'error': 'Se requiere seleccionar un paciente'}, status=400)
            if not Paciente.objects.filter(id=paciente_id).exists():
                return Response({'error': 'Paciente no encontrado'}, status=404)

        if user.rol == 'doctor' and not data.get('doctor'):
            try:
                doctor = Doctor.objects.get(usuario=user)
                data['doctor'] = doctor.id
            except Doctor.DoesNotExist:
                pass

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

    def perform_create(self, serializer):
        """Al crear una cita, enviar notificación."""
        cita = serializer.save()
        try:
            ServicioNotificaciones.notificar_cita_creada(cita)
        except Exception as e:
            logger.exception('Error enviando notificación de cita creada: %s', e)
        return cita

    def perform_update(self, serializer):
        """Al actualizar una cita, enviar notificación si es necesario."""
        cita = serializer.instance
        estado_anterior = cita.estado
        fecha_anterior = cita.fecha
        hora_anterior = cita.hora
        cita = serializer.save()

        try:
            # Detección de cambios de fecha/hora (pospuesta)
            if fecha_anterior != cita.fecha or hora_anterior != cita.hora:
                pospuesta_por = self.request.user.rol
                ServicioNotificaciones.notificar_cita_pospuesta(
                    cita,
                    pospuesta_por=pospuesta_por,
                    nueva_fecha=cita.fecha,
                    nueva_hora=cita.hora
                )
            elif estado_anterior != cita.estado:
                if cita.estado == 'cancelada':
                    cancelado_por = self.request.user.rol
                    ServicioNotificaciones.notificar_cita_cancelada(cita, cancelado_por=cancelado_por)
                elif cita.estado == 'confirmada':
                    ServicioNotificaciones.notificar_cita_confirmada(cita)
        except Exception as e:
            logger.exception('Error enviando notificación de actualización de cita: %s', e)

        return cita

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Endpoint específico para cancelar cita."""
        cita = self.get_object()
        cita.estado = 'cancelada'
        cita.save()

        try:
            cancelado_por = request.user.rol
            ServicioNotificaciones.notificar_cita_cancelada(cita, cancelado_por=cancelado_por)
        except Exception as e:
            logger.exception('Error enviando notificación de cita cancelada: %s', e)

        serializer = self.get_serializer(cita)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirmar(self, request, pk=None):
        """Endpoint específico para confirmar cita."""
        cita = self.get_object()
        cita.estado = 'confirmada'
        cita.save()

        try:
            ServicioNotificaciones.notificar_cita_confirmada(cita)
        except Exception as e:
            logger.exception('Error enviando notificación de cita confirmada: %s', e)

        serializer = self.get_serializer(cita)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mis_citas(request):
    """Obtener solo las citas del usuario actual."""
    from ..models import Usuario, Cita, Paciente, Doctor, Enfermera

    user = request.user
    if user.rol == 'patient':
        paciente = Paciente.objects.filter(usuario=user).first()
        if paciente:
            citas = Cita.objects.filter(paciente=paciente)
        else:
            citas = Cita.objects.none()
    elif user.rol == 'doctor':
        doctor = Doctor.objects.filter(usuario=user).first()
        if doctor:
            citas = Cita.objects.filter(doctor=doctor)
        else:
            citas = Cita.objects.none()
    elif user.rol == 'nurse':
        citas = Cita.objects.none()
    else:
        citas = Cita.objects.all()

    serializer = CitaSerializer(citas, many=True)
    return Response(serializer.data)
