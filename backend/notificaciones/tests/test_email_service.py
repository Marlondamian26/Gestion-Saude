"""
Tests para ServicioNotificaciones.email (§5.3).

Verifica:
- En DEV (console backend), envía a consola.
- Envío exitoso con SMTP.
- Notificacion.estado actualizado.
- Sin config en prod → falla.
"""
from django.test import TestCase, override_settings
from django.core import mail

from notificaciones.models import Notificacion
from notificaciones.services import ServicioNotificaciones
from usuarios.models import Usuario


class TestEmailService(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.usuario = Usuario.objects.create_user(
            username='emailuser', password='Test123!',
            email='user@test.local', first_name='Test', last_name='User',
            rol='patient'
        )

    @override_settings(DEBUG=True, EMAIL_HOST_USER='')
    def test_email_fallback_console_en_dev(self):
        """Sin EMAIL_HOST_USER y DEBUG=True → fallback a consola."""
        result = ServicioNotificaciones.enviar_email(
            'destino@test.local', 'Asunto', '<p>Mensaje</p>'
        )
        self.assertTrue(result[0], f"Expected success, got {result}")
        self.assertIn('consola', result[1])

    @override_settings(DEBUG=False, EMAIL_HOST_USER='')
    def test_email_falla_sin_config_en_prod(self):
        """Sin EMAIL_HOST_USER y DEBUG=False → falla."""
        result = ServicioNotificaciones.enviar_email(
            'destino@test.local', 'Asunto', '<p>Mensaje</p>'
        )
        self.assertFalse(result[0])

    @override_settings(
        DEBUG=True,
        EMAIL_HOST_USER='test@test.local',
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    )
    def test_email_exitoso_smtp(self):
        """Con backend SMTP configurado, envía correctamente."""
        result = ServicioNotificaciones.enviar_email(
            'destino@test.local', 'Asunto', '<p>Mensaje</p>'
        )
        self.assertTrue(result[0])
        self.assertEqual(len(mail.outbox), 1)

    @override_settings(
        DEBUG=True,
        EMAIL_HOST_USER='test@test.local',
        EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    )
    def test_notificacion_estado_actualizado_tras_envio(self):
        """Al enviar, Notificacion.estado pasa a 'enviada'."""
        notif = Notificacion.objects.create(
            usuario=self.usuario, tipo='nueva_cita',
            titulo='test', mensaje='msg'
        )

        result = ServicioNotificaciones.enviar_email(
            'destino@test.local', 'Asunto', '<p>Mensaje</p>',
            notificacion=notif
        )

        self.assertTrue(result[0])
        notif.refresh_from_db()
        self.assertEqual(notif.estado, 'enviada')
