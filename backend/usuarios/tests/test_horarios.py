"""
Tests for Horario model (§3.2).

Verifies:
- unique_together prevents duplicate horarios for same doctor/day/start.
- CheckConstraint enforces hora_fin > hora_inicio.
"""
from datetime import time

from django.db import IntegrityError, transaction
from django.test import TestCase

from usuarios.models import Usuario, Doctor, Especialidad, Horario


class TestHorarioConstraints(TestCase):
    """Pruebas de constraints para el modelo Horario."""

    @classmethod
    def setUpTestData(cls):
        cls.especialidad = Especialidad.objects.create(
            nombre='Medicina General', tipo_especialidad='medica'
        )
        cls.usuario = Usuario.objects.create_user(
            username='dr_test', password='Test123!', rol='doctor',
            email='dr@test.local'
        )
        cls.doctor = Doctor.objects.create(usuario=cls.usuario, especialidad=cls.especialidad)

    def test_horario_unico_por_doctor_dia_inicio_fin(self):
        """No se puede crear dos horarios con la misma combinación doctor/dia/inicio/fin."""
        Horario.objects.create(
            doctor=self.doctor, dia_semana=0,
            hora_inicio=time(8, 0), hora_fin=time(12, 0), activo=True
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Horario.objects.create(
                    doctor=self.doctor, dia_semana=0,
                    hora_inicio=time(8, 0), hora_fin=time(12, 0), activo=True
                )

    def test_horarios_distintos_mismo_doctor_mismo_dia_ok(self):
        """Mismo doctor, mismo día, distintas horas → permitido."""
        Horario.objects.create(
            doctor=self.doctor, dia_semana=0,
            hora_inicio=time(8, 0), hora_fin=time(12, 0), activo=True
        )
        h2 = Horario.objects.create(
            doctor=self.doctor, dia_semana=0,
            hora_inicio=time(13, 0), hora_fin=time(17, 0), activo=True
        )
        self.assertEqual(Horario.objects.filter(doctor=self.doctor, dia_semana=0).count(), 2)

    def test_horario_hora_fin_debe_ser_mayor_que_inicio(self):
        """hora_fin <= hora_inicio debe lanzar error."""
        with self.assertRaises(Exception):
            Horario.objects.create(
                doctor=self.doctor, dia_semana=0,
                hora_inicio=time(12, 0), hora_fin=time(8, 0), activo=True
            )

    def test_horario_hora_fin_igual_inicio_falla(self):
        """hora_fin == hora_inicio debe lanzar error."""
        with self.assertRaises(Exception):
            Horario.objects.create(
                doctor=self.doctor, dia_semana=0,
                hora_inicio=time(10, 0), hora_fin=time(10, 0), activo=True
            )

    def test_horario_valido_se_crea(self):
        """Horario válido se crea sin error."""
        h = Horario.objects.create(
            doctor=self.doctor, dia_semana=0,
            hora_inicio=time(9, 0), hora_fin=time(10, 30), activo=True
        )
        self.assertEqual(h.doctor, self.doctor)
        self.assertTrue(h.activo)
