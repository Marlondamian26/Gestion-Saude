"""
Tests para chat_metrics (§5.5).

Verifica:
- Eventos logueados correctamente (assertLogs).
- Mensaje sanitizado (truncado a 200 chars, PII eliminada).
- PII no aparece en logs (emails, teléfonos).
"""
import logging

from django.test import TestCase

from usuarios.chat_metrics import (
    log_event, log_session_started, log_intent_detected,
    log_intent_unrecognized, log_cita_creada, log_error,
    _sanitize_message
)
from usuarios.models import Usuario


class TestChatMetrics(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.user = Usuario.objects.create_user(
            username='metrics_user', password='Test123!',
            email='test@test.local', first_name='Test', last_name='User',
            rol='patient'
        )

    def test_log_session_started_logueado(self):
        """log_session_started produce un evento 'chat_session_started'."""
        with self.assertLogs('chatia.metrics', level='INFO') as logs:
            log_session_started(self.user)

        self.assertEqual(len(logs.records), 1)
        record = logs.records[0]
        self.assertEqual(record.name, 'chatia.metrics')
        data = getattr(record, 'data', {})
        self.assertEqual(data.get('event'), 'chat_session_started')

    def test_log_intent_detected_logueado(self):
        """log_intent_detected produce evento con intent."""
        with self.assertLogs('chatia.metrics', level='INFO') as logs:
            log_intent_detected(self.user, 'agendar', 'quiero agendar cita')

        record = logs.records[0]
        data = getattr(record, 'data', {})
        self.assertEqual(data.get('event'), 'chat_intent_detected')
        self.assertEqual(data.get('intent'), 'agendar')

    def test_log_cita_creada_logueado(self):
        with self.assertLogs('chatia.metrics', level='INFO') as logs:
            log_cita_creada(self.user, 42)
        data = getattr(logs.records[0], 'data', {})
        self.assertEqual(data.get('event'), 'chat_cita_creada')

    def test_pii_no_logueada(self):
        """Emails y teléfonos no aparecen en los logs."""
        email_pii = 'user@example.com'
        phone_pii = '+5491112345678'

        with self.assertLogs('chatia.metrics', level='INFO') as logs:
            log_intent_unrecognized(self.user, f'Email: {email_pii}, Phone: {phone_pii}')

        record = logs.records[0]
        data = getattr(record, 'data', {})
        raw_message = data.get('raw_message', '')

        self.assertNotIn(email_pii, raw_message)
        self.assertNotIn(phone_pii, raw_message)
        self.assertIn('[EMAIL]', raw_message)

    def test_mensaje_truncado_a_200(self):
        """Mensajes >200 chars se truncan."""
        long_msg = 'A' * 500
        result = _sanitize_message(long_msg)
        self.assertLessEqual(len(result), 200)

    def test_log_without_user(self):
        """log_event funciona sin usuario (user_id=None)."""
        with self.assertLogs('chatia.metrics', level='INFO') as logs:
            log_event(None, 'test_event', foo='bar')

        record = logs.records[0]
        data = getattr(record, 'data', {})
        self.assertEqual(data.get('event'), 'test_event')

    def test_sanitize_remueve_pii(self):
        """_sanitize_message remueve emails y teléfonos."""
        result = _sanitize_message('Contacto: test@mail.com, Phone: +5491112345678')
        self.assertNotIn('test@mail.com', result)
        self.assertNotIn('+5491112345678', result)
