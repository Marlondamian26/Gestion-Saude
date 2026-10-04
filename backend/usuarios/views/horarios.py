"""
Vistas de horarios: ViewSet con acción disponibles.
"""
import logging
from datetime import datetime

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import Horario, Doctor
from ..serializers import HorarioSerializer
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.all()
    serializer_class = HorarioSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        horario = serializer.save()
        try:
            ServicioNotificaciones.notificar_cambios_horarios(horario.doctor.usuario, 'creada')
        except Exception as e:
            logger.exception('Error enviando notificación de horario creado: %s', e)

    def perform_update(self, serializer):
        horario = serializer.save()
        try:
            ServicioNotificaciones.notificar_cambios_horarios(horario.doctor.usuario, 'actualizada')
        except Exception as e:
            logger.exception('Error enviando notificación de horario actualizado: %s', e)

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset

    @action(detail=False, methods=['get'])
    def disponibles(self, request):
        """Obtener horarios disponibles para un doctor en una fecha específica."""
        doctor_id = request.query_params.get('doctor')
        fecha = request.query_params.get('fecha')

        if not doctor_id:
            return Response({'error': 'Se requiere el parámetro doctor'}, status=400)

        try:
            doctor = Doctor.objects.get(id=doctor_id)
        except Doctor.DoesNotExist:
            return Response({'error': 'Doctor no encontrado'}, status=404)

        if fecha:
            try:
                fecha_date = datetime.strptime(fecha, '%Y-%m-%d').date()
                dia_semana = fecha_date.weekday()
                horarios = Horario.objects.filter(
                    doctor=doctor,
                    dia_semana=dia_semana,
                    activo=True
                )
            except ValueError:
                return Response({'error': 'Formato de fecha inválido. Use YYYY-MM-DD'}, status=400)
        else:
            horarios = Horario.objects.filter(doctor=doctor, activo=True)

        serializer = HorarioSerializer(horarios, many=True)
        return Response(serializer.data)
