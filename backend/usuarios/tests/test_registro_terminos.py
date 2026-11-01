from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from usuarios.models import Usuario


class TestRegistroTerminos(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.url = reverse('registro')
        self.data = {
            'username': 'legaluser',
            'password': 'TestPass123!',
            'first_name': 'Legal',
            'last_name': 'User',
            'email': 'legaluser@test.local',
            'rol': 'patient',
        }

    def test_registro_falla_sin_aceptar_terminos(self):
        response = self.client.post(self.url, self.data, format='json')

        self.assertEqual(response.status_code, 400)
        self.assertIn('acepta_terminos', response.data)
        self.assertFalse(Usuario.objects.filter(username='legaluser').exists())

    def test_registro_falla_si_terminos_no_aceptados(self):
        response = self.client.post(
            self.url,
            {**self.data, 'acepta_terminos': False},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn('acepta_terminos', response.data)
        self.assertFalse(Usuario.objects.filter(username='legaluser').exists())

    @override_settings(TERMS_VERSION='2026-test')
    def test_registro_exitoso_registra_aceptacion_fecha_y_version(self):
        before_request = timezone.now()
        response = self.client.post(
            self.url,
            {**self.data, 'acepta_terminos': True},
            format='json',
        )
        after_request = timezone.now()

        self.assertEqual(response.status_code, 201)
        user = Usuario.objects.get(username='legaluser')
        self.assertTrue(user.terminos_aceptados)
        self.assertIsNotNone(user.fecha_aceptacion_terminos)
        self.assertGreaterEqual(
            user.fecha_aceptacion_terminos,
            before_request - timedelta(seconds=1),
        )
        self.assertLessEqual(
            user.fecha_aceptacion_terminos,
            after_request + timedelta(seconds=1),
        )
        self.assertEqual(user.version_terminos_aceptada, '2026-test')
