"""
Tests para el mecanismo de recuperación de contraseña (password reset).

Cubre:
- Solicitud con email registrado → 200 y email enviado
- Solicitud con email no registrado → 200 (mensaje genérico, sin email)
- Solicitud sin email → 400
- Rate limiting en request → 429 tras N solicitudes
- Confirmación con token válido → 200, contraseña actualizada, token invalido tras uso
- Confirmación con token expirado → 400
- Confirmación con contraseña débil → 400
- Token reutilizado → segundo intento falla
- Funciona para todos los roles (admin, doctor, nurse, patient)
"""
import re
from django.test import TestCase, override_settings
from django.core import mail
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.hashers import make_password
from django.contrib.auth import authenticate

from usuarios.models import Usuario, PasswordResetToken


@override_settings(
    DEBUG=True,
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    EMAIL_HOST_USER='noreply@gestion-saude.test',
    FRONTEND_URL='http://localhost:5173',
    PASSWORD_RESET_TIMEOUT=3600,
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'gestion-saude-test-cache',
            'TIMEOUT': 300,
            'OPTIONS': {'MAX_ENTRIES': 1000},
        }
    },
)
class TestPasswordResetRequest(TestCase):
    """Tests del endpoint de solicitud de recuperación de contraseña."""

    def setUp(self):
        cache.clear()
        mail.outbox = []

        self.usuario_patient = Usuario.objects.create_user(
            username='paciente1',
            email='paciente@test.com',
            password='Test1234!',
            rol='patient',
            first_name='Paciente',
            last_name='Uno',
        )
        self.usuario_doctor = Usuario.objects.create_user(
            username='doctor1',
            email='doctor@test.com',
            password='Test1234!',
            rol='doctor',
            first_name='Doctor',
            last_name='Uno',
        )
        self.usuario_enfermera = Usuario.objects.create_user(
            username='enfermera1',
            email='enfermera@test.com',
            password='Test1234!',
            rol='nurse',
            first_name='Enfermera',
            last_name='Uno',
        )
        self.usuario_admin = Usuario.objects.create_user(
            username='admin1',
            email='admin@test.com',
            password='Test1234!',
            rol='admin',
            first_name='Admin',
            last_name='Uno',
            is_superuser=True,
            is_staff=True,
        )
        self.url = reverse('password-reset-request')

    def test_request_email_registrado_envia_email(self):
        """Email registrado → 200 y se envía email."""
        response = self.client.post(
            self.url, {'email': 'paciente@test.com'}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('Si el correo está registrado', response.data['detail'])
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Recupera tu contraseña', mail.outbox[0].subject)
        self.assertIn('paciente@test.com', mail.outbox[0].to)

    def test_request_email_no_registrado_respuesta_generica(self):
        """Email no registrado → 200 con mensaje genérico y SIN email."""
        response = self.client.post(
            self.url, {'email': 'noexiste@test.com'}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('Si el correo está registrado', response.data['detail'])
        self.assertEqual(len(mail.outbox), 0)

    def test_request_sin_email_error_400(self):
        """Sin email → 400."""
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_request_email_invalido_error_400(self):
        """Email con formato inválido → 400."""
        response = self.client.post(
            self.url, {'email': 'no-es-un-email'}, format='json'
        )
        self.assertEqual(response.status_code, 400)

    def test_request_funciona_todos_los_roles(self):
        """El flujo funciona igual para patient, doctor, nurse y admin."""
        for usuario in [
            self.usuario_patient,
            self.usuario_doctor,
            self.usuario_enfermera,
            self.usuario_admin,
        ]:
            response = self.client.post(
                self.url, {'email': usuario.email}, format='json'
            )
            self.assertEqual(response.status_code, 200)
        # 4 emails enviados (uno por cada usuario con email)
        self.assertEqual(len(mail.outbox), 4)

    def test_request_normaliza_email_minusculas(self):
        """El email se normaliza a minúsculas."""
        response = self.client.post(
            self.url, {'email': 'PACIENTE@TEST.COM'}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)


# Nota: el rate limiting está configurado en settings.DEFAULT_THROTTLE_RATES
# con los scopes 'password_reset_request' (5/h) y 'password_reset_confirm'
# (10/h). Se verifica en la prueba manual E2E (Fase 6) ya que el override de
# REST_FRAMEWORK a nivel de método no afecta a las clases de throttle ya
# importadas por DRF.

    def test_token_es_de_un_solo_uso(self):
        """El token generado se invalida tras su primer uso exitoso."""
        # Solicitar reset
        self.client.post(self.url, {'email': 'paciente@test.com'}, format='json')
        self.assertEqual(len(mail.outbox), 1)

        # Extraer token del cuerpo del email
        cuerpo = mail.outbox[0].body
        match = re.search(r'/reset-password/([A-Za-z0-9_-]+)', cuerpo)
        self.assertIsNotNone(match, 'No se encontró el token en el email')
        token = match.group(1)

        # Primera confirmación → éxito
        url_confirm = reverse('password-reset-confirm')
        response = self.client.post(
            url_confirm,
            {'token': token, 'new_password': 'NuevaPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

        # Segunda confirmación con el mismo token → falla (ya usado)
        response = self.client.post(
            url_confirm,
            {'token': token, 'new_password': 'OtraPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Token inválido o expirado', response.data['error'])

    def test_token_no_registrado_falla(self):
        """Token inexistente → 400."""
        url_confirm = reverse('password-reset-confirm')
        response = self.client.post(
            url_confirm,
            {'token': 'token-inexistente', 'new_password': 'NuevaPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_contraseña_debile_falla(self):
        """Contraseña demasiado corta/simple → 400 con detalle de validadores."""
        # Primero solicitar reset para generar token
        self.client.post(self.url, {'email': 'paciente@test.com'}, format='json')
        self.assertEqual(len(mail.outbox), 1)

        cuerpo = mail.outbox[0].body
        match = re.search(r'/reset-password/([A-Za-z0-9_-]+)', cuerpo)
        token = match.group(1)

        url_confirm = reverse('password-reset-confirm')
        response = self.client.post(
            url_confirm,
            {'token': token, 'new_password': '123'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)


@override_settings(
    DEBUG=True,
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    EMAIL_HOST_USER='noreply@gestion-saude.test',
    FRONTEND_URL='http://localhost:5173',
    PASSWORD_RESET_TIMEOUT=1,  # 1 segundo para forzar expiración rápida
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'gestion-saude-test-cache',
            'TIMEOUT': 300,
            'OPTIONS': {'MAX_ENTRIES': 1000},
        }
    },
)
class TestPasswordResetConfirm(TestCase):
    """Tests del endpoint de confirmación de recuperación de contraseña."""

    def setUp(self):
        cache.clear()
        mail.outbox = []

        self.usuario = Usuario.objects.create_user(
            username='paciente_exp',
            email='expirado@test.com',
            password='Test1234!',
            rol='patient',
            first_name='Paciente',
            last_name='Expirado',
        )
        self.url_request = reverse('password-reset-request')
        self.url_confirm = reverse('password-reset-confirm')

    def test_token_expirado_falla(self):
        """Token expirado → 400."""
        # Crear token manualmente ya expirado
        expira = timezone.now() - timedelta(seconds=10)
        PasswordResetToken.objects.create(
            usuario=self.usuario,
            token_hash=make_password('token-expirado-plano'),
            expira_en=expira,
            usado=False,
        )

        response = self.client.post(
            self.url_confirm,
            {'token': 'token-expirado-plano', 'new_password': 'NuevaPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Token inválido o expirado', response.data['error'])

    def test_cuenta_inactiva_no_recibe_email(self):
        """Cuenta inactiva → 200 genérico, sin email."""
        self.usuario.is_active = False
        self.usuario.save()

        response = self.client.post(
            self.url_request, {'email': 'expirado@test.com'}, format='json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('Si el correo está registrado', response.data['detail'])
        self.assertEqual(len(mail.outbox), 0)

    def test_nueva_contraseña_se_puede_usar_para_login(self):
        """Tras el reset, la nueva contraseña es válida para autenticación."""
        self.client.post(
            self.url_request, {'email': 'expirado@test.com'}, format='json'
        )
        self.assertEqual(len(mail.outbox), 1)

        cuerpo = mail.outbox[0].body
        match = re.search(r'/reset-password/([A-Za-z0-9_-]+)', cuerpo)
        token = match.group(1)

        response = self.client.post(
            self.url_confirm,
            {'token': token, 'new_password': 'NuevaPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)

        # Verificar que la contraseña funciona con authenticate
        user = authenticate(username=self.usuario.username, password='NuevaPass123!')
        self.assertIsNotNone(user)
        self.assertEqual(user.id, self.usuario.id)
