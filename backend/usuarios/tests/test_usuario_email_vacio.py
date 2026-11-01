from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Paciente, Usuario


class TestEmailVacioEnAltas(TestCase):
    def setUp(self):
        from django.core.cache import cache
        cache.clear()

        self.admin = Usuario.objects.create_user(
            username='admin-email-test',
            password='AdminPass123!',
            email='admin-email-test@example.com',
            rol='admin',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_altas_de_usuarios_sin_email_aceptan_campos_vacios(self):
        for username, rol in (
            ('patient-without-email', 'patient'),
            ('doctor-without-email', 'doctor'),
            ('nurse-without-email', 'nurse'),
        ):
            with self.subTest(rol=rol):
                response = self.client.post(
                    '/api/usuarios/',
                    {
                        'username': username,
                        'password': 'TestPass123!',
                        'first_name': 'Test',
                        'last_name': 'User',
                        'email': '',
                        'telefono': '',
                        'rol': rol,
                    },
                )

                self.assertEqual(response.status_code, 201, response.data)
                user = Usuario.objects.get(username=username)
                self.assertIsNone(user.email)
                if rol == 'patient':
                    self.assertTrue(Paciente.objects.filter(usuario=user).exists())

    def test_registros_sin_email_pueden_repetirse(self):
        for username in ('patient-no-email-1', 'patient-no-email-2'):
            with self.subTest(username=username):
                response = self.client.post(
                    '/api/usuarios/',
                    {
                        'username': username,
                        'password': 'TestPass123!',
                        'first_name': 'Test',
                        'last_name': 'Patient',
                        'email': '',
                        'rol': 'patient',
                    },
                )

                self.assertEqual(response.status_code, 201, response.data)

    def test_email_existente_sigue_rechazandose_sin_error_del_servidor(self):
        response = self.client.post(
            '/api/usuarios/',
            {
                'username': 'duplicate-email-user',
                'password': 'TestPass123!',
                'first_name': 'Duplicate',
                'last_name': 'Email',
                'email': self.admin.email,
                'rol': 'patient',
            },
        )

        self.assertEqual(response.status_code, 400, response.data)
        self.assertIn('email', response.data)

    def test_registro_publico_sin_email_puede_repetirse(self):
        client = APIClient()
        for username in ('public-no-email-1', 'public-no-email-2'):
            with self.subTest(username=username):
                response = client.post(
                    '/api/registro/',
                    {
                        'username': username,
                        'password': 'TestPass123!',
                        'first_name': 'Public',
                        'last_name': 'Patient',
                        'email': '',
                        'rol': 'patient',
                        'acepta_terminos': True,
                    },
                )

                self.assertEqual(response.status_code, 201, response.data)
                self.assertIsNone(Usuario.objects.get(username=username).email)
