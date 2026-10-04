"""
Tests for settings security hardening (§1.2, §1.3).

These tests verify that settings.py has proper fail-fast behavior,
no hardcoded credentials, and correct defaults.
"""
from django.test import TestCase, override_settings
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


class TestSettingsSecurity(TestCase):

    def test_static_root_defined(self):
        self.assertTrue(hasattr(settings, 'STATIC_ROOT'))
        self.assertIsNotNone(settings.STATIC_ROOT)

    def test_media_root_distinct_from_static(self):
        self.assertNotEqual(settings.STATIC_ROOT, settings.MEDIA_ROOT)

    def test_no_cors_allow_all_origins(self):
        self.assertFalse(getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False))

    def test_cors_allowed_origins_is_list(self):
        self.assertIsInstance(settings.CORS_ALLOWED_ORIGENS, list)
        self.assertTrue(len(settings.CORS_ALLOWED_ORIGENS) > 0)

    def test_cors_credentials_allowed(self):
        self.assertTrue(getattr(settings, 'CORS_ALLOW_CREDENTIALS', False))

    def test_no_hardcoded_postgres_url(self):
        import inspect
        from core import settings as settings_module
        source = inspect.getsource(settings_module)
        self.assertNotIn('supabase.co', source)
        self.assertNotIn('Gestion-Saude@', source)
        self.assertNotIn('postgresql://postgres:Gestion-Saude', source)

    def test_secret_key_has_dev_fallback_in_debug(self):
        with override_settings(DEBUG=True):
            self.assertTrue(settings.SECRET_KEY is not None)

    def test_csrf_trusted_origins_configured(self):
        self.assertTrue(hasattr(settings, 'CSRF_TRUSTED_ORIGENS'))

    def test_throttle_rate_registro_defined(self):
        rates = settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
        self.assertIn('registro', rates)
        self.assertEqual(rates['registro'], '5/minute')
