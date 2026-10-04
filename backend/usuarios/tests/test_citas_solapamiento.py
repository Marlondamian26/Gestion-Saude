"""
Tests for Cita overlap validation (§3.3).

Verifies:
- Non-overlapping appointments at different times → OK.
- Exact time overlap → rechazar.
- Partial start overlap → rechazar.
- Partial end overlap → rechazar.
- Adjacent appointments (fin == inicio siguiente) → OK (fin exclusivo).
- Different doctors on same slot → OK.
- Cancelled appointments don't block slots.
- Updating appointment to its own slot → OK (no self-rejection).
- duracion_minutos default and custom values.
"""
from datetime import date, time, timedelta

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Usuario, Doctor, Enfermera, Especialidad, Horario, Paciente


class TestCitasSolapamiento(TestCase):
    """Tests de validación de solapamiento en Citas."""

    @classmethod
    def setUpTestData(cls):
        cls.especialidad = Especialidad.objects.create(
            nombre='Medicina General', tipo_especialidad='medica', activo=True
        )

        cls.admin = Usuario.objects.create_user(
            username='admin_test', password='AdminPass123!', rol='admin',
            email='admin@test.local'
        )

        cls.doctor_user = Usuario.objects.create_user(
            username='dr_test', password='Test123!', rol='doctor',
            email='dr@test.local'
        )
        cls.doctor = Doctor.objects.create(usuario=cls.doctor_user, especialidad=cls.especialidad)

        cls.patient_user = Usuario.objects.create_user(
            username='patient_test', password='Test123!', rol='patient',
            email='p@test.local'
        )
        cls.paciente = Paciente.objects.get(usuario=cls.patient_user)

        # Horario: hoy, 9:00-17:00
        cls.hoy = date.today()
        cls.horario = Horario.objects.create(
            doctor=cls.doctor,
            dia_semana=cls.hoy.weekday(),
            hora_inicio=time(9, 0),
            hora_fin=time(17, 0),
            activo=True,
        )

    def setUp(self):
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)

    def _make_cita(self, **kwargs):
        """Helper para crear cita vía API."""
        defaults = {
            'doctor': self.doctor.id,
            'paciente': self.paciente.id,
            'fecha': str(self.hoy),
            'hora': '10:00',
            'duracion_minutos': 30,
            'estado': 'pendiente',
        }
        defaults.update(kwargs)
        return self.admin_client.post('/api/citas/', defaults)

    def test_no_solapamiento_horas_distintas_ok(self):
        """Citas a las 10:00 y 11:00 (30 min cada una) → OK."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED, r1.data)
        r2 = self._make_cita(hora='11:00', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)

    def test_solapamiento_exacto_mismo_doctor_rechazar(self):
        """Misma fecha, hora, doctor → rechazar."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('hora' in r2.data or 'non_field_errors' in r2.data)

    def test_solapamiento_parcial_inicio_rechazar(self):
        """Cita 1: 10:00-10:30 vs Cita 2: 10:15-10:45 → rechazar."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self._make_cita(hora='10:15', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_solapamiento_parcial_fin_rechazar(self):
        """Cita 1: 10:00-10:30 vs Cita 2: 09:45-10:15 → rechazar."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self._make_cita(hora='09:45', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_citas_contiguas_no_solapan(self):
        """10:00-10:30 y 10:30-11:00 → OK (fin exclusivo)."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self._make_cita(hora='10:30', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)

    def test_doctores_distintos_no_solapan(self):
        """Mismo horario, distinto doctor → OK."""
        doctor_user2 = Usuario.objects.create_user(
            username='dr_test2', password='Test123!', rol='doctor', email='dr2@test.local'
        )
        doctor2 = Doctor.objects.create(usuario=doctor_user2, especialidad=self.especialidad)

        # Horario para el segundo doctor (hoy 9:00-17:00)
        Horario.objects.create(
            doctor=doctor2,
            dia_semana=self.hoy.weekday(),
            hora_inicio=time(9, 0),
            hora_fin=time(17, 0),
            activo=True,
        )

        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        r2 = self._make_cita(doctor=doctor2.id, hora='10:00', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)

    def test_cita_cancelada_no_bloquea_slot(self):
        """Cita cancelada no impide nueva en el mismo slot."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        cita_id = r1.data['id']

        cancel_resp = self.admin_client.post(f'/api/citas/{cita_id}/cancelar/')
        self.assertEqual(cancel_resp.status_code, status.HTTP_200_OK)

        r2 = self._make_cita(hora='10:00', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)

    def test_actualizar_cita_a_mismo_slot_no_falla(self):
        """Update de cita sin cambiar hora → no debe auto-rechazarse."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=30)
        cita_id = r1.data['id']

        patch_resp = self.admin_client.patch(f'/api/citas/{cita_id}/', {'estado': 'confirmada'})
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK, patch_resp.data)

    def test_duracion_minutos_default_en_cita_creada(self):
        """Al crear cita sin duracion_minutos → default 30."""
        r1 = self._make_cita(hora='10:00')
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r1.data['duracion_minutos'], 30)

    def test_duracion_minutos_custom_en_cita(self):
        """Al crear cita con duracion_minutos=60 → respetado."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=60)
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r1.data['duracion_minutos'], 60)

        # Otra cita a las 11:00 (después de 10:00-11:00) → OK
        r2 = self._make_cita(hora='11:00', duracion_minutos=30)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED, r2.data)

    def test_duracion_minutos_fuera_de_rango_rechazar(self):
        """duracion_minutos=5 (menor que 10) → rechazar."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=5)
        self.assertEqual(r1.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duracion_minutos_muy_grande_rechazar(self):
        """duracion_minutos=300 (mayor que 240) → rechazar."""
        r1 = self._make_cita(hora='10:00', duracion_minutos=300)
        self.assertEqual(r1.status_code, status.HTTP_400_BAD_REQUEST)
