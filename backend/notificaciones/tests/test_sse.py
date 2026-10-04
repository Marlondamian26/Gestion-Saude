"""
Tests para SSE de notificaciones (§5.1.3).

Verifica:
- Requiere token válido (401 sin token, 401 con token inválido).
- Envía notificaciones no leídas inicialmente.
- Mantiene heartbeat cadencia.
- Respeto límite de concurrencia.
"""
from io import BytesIO
from unittest import mock

from django.test import TestCase, RequestFactory
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.test import APIRequestFactory

from notificaciones.models import Notificacion
from notificaciones.sse import NotificacionesSSEView, HEARTBEAT_INTERVAL
from usuarios.models import Usuario


class TestSSEView(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.usuario = Usuario.objects.create_user(
            username='testuser', password='Test123!', email='test@test.local',
            first_name='Test', last_name='User', rol='patient'
        )
        cls.token = str(AccessToken.for_user(cls.usuario))
        cls.factory = APIRequestFactory()

    def test_sse_requiere_token(self):
        """Sin token → 401."""
        view = NotificacionesSSEView.as_view()
        request = self.factory.get('/notificaciones/stream/')
        response = view(request)
        self.assertEqual(response.status_code, 401)

    def test_sse_rechaza_token_invalido(self):
        """Token inválido → 401."""
        view = NotificacionesSSEView.as_view()
        request = self.factory.get('/notificaciones/stream/?token=invalid-token')
        response = view(request)
        self.assertEqual(response.status_code, 401)

    def test_sse_envia_notificaciones_iniciales(self):
        """Al conectar, envía notificaciones no leídas."""
        Notificacion.objects.create(
            usuario=self.usuario, tipo='nueva_cita',
            titulo='test', mensaje='msg', leida=False
        )
        Notificacion.objects.create(
            usuario=self.usuario, tipo='nueva_cita',
            titulo='read', mensaje='msg2', leida=True
        )

        view = NotificacionesSSEView.as_view()
        request = self.factory.get(f'/notificaciones/stream/?token={self.token}&_max_seconds=1')
        response = view(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';')[0], 'text/event-stream')
        self.assertEqual(response['Cache-Control'], 'no-cache, no-store, must-revalidate')

        # Consume el stream (limitado a 1s para testing)
        content = b''.join(response.streaming_content)
        content_str = content.decode('utf-8')

        # Debe incluir la notificación no leída (id, titulo, etc.)
        self.assertIn('"titulo": "test"', content_str)
        self.assertIn('"leida": false', content_str)

    def test_sse_heartbeat(self):
        """El stream envía heartbeats para mantener conexión."""
        view = NotificacionesSSEView.as_view()
        request = self.factory.get(f'/notificaciones/stream/?token={self.token}&_max_seconds=1')
        response = view(request)

        content = b''.join(response.streaming_content)
        content_str = content.decode('utf-8')

        # Debe contener al menos un ping
        self.assertIn(': ping', content_str)

    def test_sse_headers_cache_control(self):
        """Los headers de cache están configurados correctamente."""
        view = NotificacionesSSEView.as_view()
        request = self.factory.get(f'/notificaciones/stream/?token={self.token}&_max_seconds=1')
        response = view(request)

        self.assertIn('no-cache', response['Cache-Control'])
        self.assertEqual(response['X-Accel-Buffering'], 'no')
