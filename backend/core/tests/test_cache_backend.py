"""
Tests for cache backend configuration (§2.1).

Verifies:
- With REDIS_URL set -> backend is RedisCache.
- Without REDIS_URL + DEBUG=False -> ImproperlyConfigured (fail-fast).
- Without REDIS_URL + DEBUG=True -> LocMemCache (dev fallback).
- Redis cache config has KEY_PREFIX.
"""
import os
import subprocess
import sys
from pathlib import Path

from django.test import TestCase
from django.conf import settings


BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class TestCacheBackendConfig(TestCase):
    """Pruebas de configuración del cache backend."""

    def test_redis_url_uses_redis_cache(self):
        """Cuando REDIS_URL está en env, el backend debería ser RedisCache.

        Nota: estas pruebas corren con las env vars del proceso actual.
        En CI con REDIS_URL seteado verifica RedisCache; sin REDIS_URL en DEBUG verifica LocMem.
        """
        redis_url = os.environ.get('REDIS_URL')
        if redis_url:
            self.assertEqual(
                settings.CACHES['default']['BACKEND'],
                'django_redis.cache.RedisCache'
            )
            self.assertEqual(
                settings.CACHES['default']['LOCATION'],
                redis_url
            )
        else:
            # Sin REDIS_URL en DEBUG, debe ser LocMem
            self.assertEqual(
                settings.CACHES['default']['BACKEND'],
                'django.core.cache.backends.locmem.LocMemCache'
            )

    def test_redis_cache_has_key_prefix(self):
        """El cache debe tener KEY_PREFIX para evitar colisiones."""
        if os.environ.get('REDIS_URL'):
            self.assertIn('KEY_PREFIX', settings.CACHES['default'])
            self.assertTrue(settings.CACHES['default']['KEY_PREFIX'])

    def test_prod_without_redis_url_fails(self):
        """En producción (DEBUG=False), sin REDIS_URL debe lanzar ImproperlyConfigured."""
        env = dict(os.environ)
        env['DEBUG'] = 'false'
        env.pop('REDIS_URL', None)
        env['SECRET_KEY'] = 'test-fail-fast'
        env['ALLOWED_HOSTS'] = 'localhost'

        result = subprocess.run(
            [sys.executable, '-c',
             'import os, django; os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings"); '
             'django.setup()'],
            env=env,
            capture_output=True,
            text=True,
            cwd=str(BACKEND_DIR),
        )
        combined = result.stderr + result.stdout
        self.assertIn('ImproperlyConfigured', combined)
        self.assertIn('REDIS_URL must be set', combined)

    def test_dev_without_redis_url_uses_locmem(self):
        """En desarrollo (DEBUG=True), sin REDIS_URL usa LocMemCache."""
        env = dict(os.environ)
        env['DEBUG'] = 'true'
        env.pop('REDIS_URL', None)
        env['SECRET_KEY'] = 'dev-fallback-test'

        result = subprocess.run(
            [sys.executable, '-c',
             'import os, django; os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings"); '
             'django.setup(); from django.conf import settings; '
             'print(settings.CACHES["default"]["BACKEND"])'],
            env=env,
            capture_output=True,
            text=True,
            cwd=str(BACKEND_DIR),
        )
        self.assertEqual(result.returncode, 0,
                         f"stderr: {result.stderr}, stdout: {result.stdout}")
        self.assertIn('locmem.LocMemCache', result.stdout)

    def test_cache_timeout_is_set(self):
        """El cache debe tener un TIMEOUT configurado."""
        self.assertIn('TIMEOUT', settings.CACHES['default'])
        self.assertTrue(settings.CACHES['default']['TIMEOUT'] > 0)
