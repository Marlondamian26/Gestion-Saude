"""
Tests for database configuration (§2.3).

Verifies:
- CONN_MAX_AGE is set for connection pooling.
- CONN_HEALTH_CHECKS is enabled.
- sslmode=require when using Supabase-style PostgreSQL URLs.
- connect_timeout is configured.
- psycopg3 is the PostgreSQL driver (not psycopg2).
"""
from unittest import mock
import os

from django.test import TestCase
from django.conf import settings


class TestDatabaseConfig(TestCase):
    """Pruebas de configuración de base de datos."""

    def test_conn_max_age_is_set(self):
        """CONN_MAX_AGE debe estar configurado para pooling."""
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            self.skipTest("SQLite no usa CONN_MAX_AGE de la misma forma")
        self.assertGreater(settings.DATABASES['default']['CONN_MAX_AGE'], 0)

    def test_conn_health_checks_enabled(self):
        """CONN_HEALTH_CHECKS debe estar activado en configuración PostgreSQL."""
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            self.skipTest("SQLite no usa CONN_HEALTH_CHECKS de la misma forma")
        self.assertTrue(settings.DATABASES['default'].get('CONN_HEALTH_CHECKS', False))

    def test_connect_timeout_configured(self):
        """connect_timeout debe estar en OPTIONS para PostgreSQL."""
        if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
            self.skipTest("SQLite no usa connect_timeout")
        options = settings.DATABASES['default'].get('OPTIONS', {})
        self.assertIn('connect_timeout', options)
        self.assertEqual(options['connect_timeout'], 10)

    def test_sslmode_require_for_supabase(self):
        """Cuando DATABASE_URL es Supabase, sslmode debe ser 'require'."""
        test_url = 'postgres://user:pass@db.abc.supabase.co:5432/postgres'
        with mock.patch.dict(os.environ, {'DATABASE_URL': test_url, 'DEBUG': 'true',
                                          'SECRET_KEY': 'test', 'ALLOWED_HOSTS': 'localhost'}, clear=False):
            import importlib
            from core import settings as settings_module
            importlib.reload(settings_module)
            options = settings_module.DATABASES['default'].get('OPTIONS', {})
            self.assertEqual(options.get('sslmode'), 'require')

    def test_pg_engine_uses_psycopg3_not_psycopg2(self):
        """El driver PostgreSQL debe ser psycopg3 (psycopg), no psycopg2."""
        try:
            import psycopg
            self.assertTrue(hasattr(psycopg, '__version__'))
        except ImportError:
            self.fail("psycopg3 (psycopg) not installed")

    def test_no_psycopg2_in_requirements(self):
        """requirements.txt no debe contener psycopg2-binary."""
        import pathlib
        req_path = pathlib.Path(__file__).resolve().parent.parent.parent / 'requirements.txt'
        if req_path.exists():
            content = req_path.read_text()
            self.assertNotIn('psycopg2', content)
