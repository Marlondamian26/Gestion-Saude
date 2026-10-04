"""
Tests para health check (§6.4).

Verifica:
- 200 cuando todos los componentes OK.
- 503 si DB falla.
- No expone hostnames.
- Rate limiting funciona.
"""
import json
from unittest import mock

from django.test import TestCase, RequestFactory

from core.health import health_view, HEALTH_RATE_LIMIT


class TestHealthView(TestCase):

    def setUp(self):
        self.factory = RequestFactory()
        from django.core.cache import cache
        cache.clear()

    def test_health_ok(self):
        """Health check devuelve 200 con todos los componentes OK."""
        request = self.factory.get('/health/')
        response = health_view(request)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'ok')
        self.assertIn('components', data)
        self.assertIn('db', data['components'])
        self.assertIn('cache', data['components'])
        self.assertIn('redis', data['components'])

    @mock.patch('core.health._check_db')
    def test_health_503_si_db_falla(self, mock_db):
        """503 si DB falla."""
        mock_db.return_value = {'status': 'error', 'error': 'OperationalError'}
        request = self.factory.get('/health/')
        response = health_view(request)
        self.assertEqual(response.status_code, 503)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'error')

    def test_health_no_expone_hostname(self):
        """No expone hostname en la respuesta."""
        request = self.factory.get('/health/')
        response = health_view(request)
        data = json.loads(response.content)
        self.assertNotIn('hostname', data)
        self.assertNotIn('host', str(data).lower())

    def test_health_no_expone_versiones_paquetes(self):
        """No expone versiones de paquetes."""
        request = self.factory.get('/health/')
        response = health_view(request)
        data = json.loads(response.content)
        for key in data:
            if key == 'version':
                val = data[key]
                self.assertLess(len(val), 10)

    @mock.patch('core.health._check_db')
    def test_health_rate_limited_after_threshold(self, mock_db):
        """Después de HEALTH_RATE_LIMIT requests, devuelve 429."""
        mock_db.return_value = {'status': 'ok', 'latency_ms': 1}

        response = None
        for i in range(HEALTH_RATE_LIMIT + 2):
            request = self.factory.get('/health/')
            response = health_view(request)
            if response.status_code == 429:
                break

        self.assertEqual(response.status_code, 429)
        data = json.loads(response.content)
        self.assertEqual(data['status'], 'rate_limited')
