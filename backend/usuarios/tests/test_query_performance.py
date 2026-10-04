"""
Tests para N+1 queries y performance de views (FASE 7 §7.1.2-7.1.3)

Valida que los ViewSets usan select_related para evitar N+1.
"""
import pytest
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIRequestFactory, APIClient
from rest_framework.request import Request

from django.contrib.auth import get_user_model
from usuarios.models import Doctor, Paciente, Especialidad, Cita, Horario
from notificaciones.models import Notificacion
from datetime import date, time, timedelta


User = get_user_model()


@pytest.mark.django_db
class TestQueryPerformanceCitas(TestCase):
    """Valida que CitaViewSet no genera N+1 queries."""

    def setUp(self):
        self.especialidad = Especialidad.objects.create(
            nombre='General', tipo_especialidad='medica'
        )
        self.doctor_user = User.objects.create_user(
            username='dr_perf', rol='doctor', password='pass123',
            email='dr_perf@test.local'
        )
        self.doctor = Doctor.objects.create(
            usuario=self.doctor_user, especialidad=self.especialidad
        )
        self.patient_user = User.objects.create_user(
            username='pat_perf', rol='patient', password='pass123',
            email='pat_perf@test.local'
        )
        self.paciente = Paciente.objects.get(usuario=self.patient_user)

        # 10 citas distintas (evita unique constraint)
        for i in range(10):
            Cita.objects.create(
                doctor=self.doctor,
                paciente=self.paciente,
                fecha=date(2026, 10, 15),
                hora=time(8, i),
                estado='confirmada',
                duracion_minutos=30,
            )

    def test_cita_viewset_no_n_plus_1(self):
        """Listado de 10 citas debería ser 1 query con select_related."""
        client = APIClient()
        client.force_authenticate(user=self.doctor_user)

        with self.assertNumQueries(3):  # 1 (citas+joins) + 1 (count) + 1 (user lookup)
            response = client.get('/api/citas/')

        assert response.status_code == 200
        assert len(response.data['results']) == 10

    def test_notificacion_viewset_no_n_plus_1(self):
        """Listado de 10 notificaciones debería ser ~2 queries."""
        for i in range(10):
            Notificacion.objects.create(
                usuario=self.doctor_user,
                tipo='recordatorio_cita',
                titulo=f'Test {i}',
                mensaje=f'Msg {i}',
                estado='enviada',
            )

        client = APIClient()
        client.force_authenticate(user=self.doctor_user)

        with self.assertNumQueries(2):  # 1 (notificaciones+join) + 1 (count)
            response = client.get('/api/notificaciones/')

        assert response.status_code == 200
        assert len(response.data['results']) == 10

    def test_horario_viewset_no_n_plus_1(self):
        """Listado de 10 horarios debería ser 1 query con select_related."""
        for i in range(10):
            Horario.objects.create(
                doctor=self.doctor,
                dia_semana=i % 7,
                hora_inicio=time(9 + i, 0),
                hora_fin=time(10 + i, 0),
                activo=True,
            )

        client = APIClient()
        client.force_authenticate(user=self.doctor_user)

        with self.assertNumQueries(2):  # 1 (horarios+joins) + 1 (count)
            response = client.get('/api/horarios/?doctor=' + str(self.doctor.id))

        assert response.status_code == 200
        assert len(response.data['results']) == 10
