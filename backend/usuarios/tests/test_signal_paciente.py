"""
Tests para la señal post_save que sincroniza Perfil Paciente con Rol Usuario (§3.4).

Cobertura:
- P1: rol 'patient' crea Paciente (idempotente)
- P2: cambio de rol NO elimina Paciente
- P3: usuario 'admin' no recibe Paciente
- P4: rol no-patient no crea Paciente
"""
from django.contrib.auth import get_user_model
from django.test import TestCase

from usuarios.models import Paciente

User = get_user_model()


class SincronizarPerfilPacienteTest(TestCase):
    def test_patient_crea_paciente(self):
        u = User.objects.create_user(username="p1", email="p1@e.com", rol="patient", password="x123")
        self.assertTrue(Paciente.objects.filter(usuario=u).exists(),
                        "Al crear usuario con rol='patient' debe crearse Paciente")

    def test_patient_no_crea_paciente_para_admin(self):
        User.objects.create_user(username="admin", email="admin@e.com", rol="admin", password="x123")
        self.assertFalse(Paciente.objects.filter(usuario__username="admin").exists(),
                         "El usuario 'admin' no debe recibir Paciente")

    def test_no_patient_no_crea_paciente(self):
        u = User.objects.create_user(username="d1", email="d1@e.com", rol="doctor", password="x123")
        self.assertFalse(Paciente.objects.filter(usuario=u).exists(),
                         "Usuario con rol='doctor' no debe recibir Paciente")

    def test_cambio_rol_mantiene_paciente(self):
        u = User.objects.create_user(username="p2", email="p2@e.com", rol="patient", password="x123")
        self.assertTrue(Paciente.objects.filter(usuario=u).exists())
        u.rol = "doctor"
        u.save()
        self.assertTrue(Paciente.objects.filter(usuario=u).exists(),
                        "Cambio de rol patient→doctor debe mantener Paciente (P2: no borrar)")

    def test_idempotente_get_or_create(self):
        u = User.objects.create_user(username="p3", email="p3@e.com", rol="patient", password="x123")
        u.save()
        u.save()
        self.assertEqual(Paciente.objects.filter(usuario=u).count(), 1,
                         "Guardar múltiple veces no debe crear Pacientes duplicados")
