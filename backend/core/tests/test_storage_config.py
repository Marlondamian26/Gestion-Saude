import json
import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from django.test import SimpleTestCase


BACKEND_DIR = Path(__file__).resolve().parents[2]
SETTINGS_PROBE = """
import json
import django
django.setup()
from django.conf import settings
print(json.dumps({
    "media_storage": settings.MEDIA_STORAGE,
    "media_url": settings.MEDIA_URL,
    "default_backend": settings.STORAGES["default"]["BACKEND"],
    "options": settings.STORAGES["default"].get("OPTIONS", {}),
    "storages_installed": "storages" in settings.INSTALLED_APPS,
}))
"""


class TestStorageConfig(SimpleTestCase):
    def run_settings_probe(self, **overrides):
        env = os.environ.copy()
        for key in (
            'MEDIA_STORAGE',
            'SUPABASE_S3_ACCESS_KEY',
            'SUPABASE_S3_SECRET_KEY',
            'SUPABASE_STORAGE_BUCKET',
            'SUPABASE_S3_ENDPOINT',
            'SUPABASE_S3_REGION',
            'DATABASE_URL',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'AWS_STORAGE_BUCKET_NAME',
            'AWS_S3_ENDPOINT_URL',
        ):
            env.pop(key, None)
        env.update({
            'DJANGO_SETTINGS_MODULE': 'test_settings',
            'DEBUG': 'True',
            'SECRET_KEY': 'storage-test-key',
            'ALLOWED_HOSTS': 'localhost,127.0.0.1,testserver',
            'REDIS_URL': '',
            'SENTRY_DSN': '',
        })
        env.update(overrides)
        return subprocess.run(
            [sys.executable, '-c', SETTINGS_PROBE],
            cwd=BACKEND_DIR,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_storage_filesystem_por_defecto(self):
        result = self.run_settings_probe()

        self.assertEqual(result.returncode, 0, result.stderr)
        configuration = json.loads(result.stdout)
        self.assertEqual(configuration['media_storage'], 'filesystem')
        self.assertEqual(
            configuration['default_backend'],
            'django.core.files.storage.FileSystemStorage',
        )
        self.assertEqual(configuration['media_url'], '/media/')
        self.assertFalse(configuration['storages_installed'])

    def test_storage_s3_con_vars(self):
        result = self.run_settings_probe(
            MEDIA_STORAGE='s3',
            SUPABASE_S3_ACCESS_KEY='test-access-key',
            SUPABASE_S3_SECRET_KEY='test-secret-key',
            SUPABASE_S3_ENDPOINT='https://storage.example.test/storage/v1/s3',
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        configuration = json.loads(result.stdout)
        self.assertEqual(
            configuration['default_backend'],
            'storages.backends.s3.S3Storage',
        )
        self.assertTrue(configuration['storages_installed'])
        self.assertEqual(configuration['media_url'], '/media/')
        self.assertEqual(configuration['options']['addressing_style'], 'path')
        self.assertEqual(configuration['options']['signature_version'], 's3v4')
        self.assertTrue(configuration['options']['querystring_auth'])
        self.assertEqual(configuration['options']['querystring_expire'], 604800)

    def test_storage_s3_sin_credenciales_falla_en_produccion(self):
        result = self.run_settings_probe(
            DEBUG='False',
            MEDIA_STORAGE='s3',
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertIn('ImproperlyConfigured', result.stderr)
        self.assertIn('SUPABASE_S3_ACCESS_KEY', result.stderr)
        self.assertNotIn('test-secret-key', result.stderr)

    def test_media_url_devuelve_url_firmada_s3(self):
        result = self.run_settings_probe(
            MEDIA_STORAGE='s3',
            SUPABASE_S3_ACCESS_KEY='test-access-key',
            SUPABASE_S3_SECRET_KEY='test-secret-key',
            SUPABASE_S3_ENDPOINT='https://storage.example.test/storage/v1/s3',
        )
        self.assertEqual(result.returncode, 0, result.stderr)

        env = os.environ.copy()
        env.update({
            'DJANGO_SETTINGS_MODULE': 'test_settings',
            'DEBUG': 'True',
            'SECRET_KEY': 'storage-test-key',
            'ALLOWED_HOSTS': 'localhost,127.0.0.1,testserver',
            'REDIS_URL': '',
            'MEDIA_STORAGE': 's3',
            'SUPABASE_S3_ACCESS_KEY': 'test-access-key',
            'SUPABASE_S3_SECRET_KEY': 'test-secret-key',
            'SUPABASE_S3_ENDPOINT': 'https://storage.example.test/storage/v1/s3',
        })
        url_probe = subprocess.run(
            [
                sys.executable,
                '-c',
                'import django; django.setup(); '
                'from django.core.files.storage import default_storage; '
                'print(default_storage.url("test.webp"))',
            ],
            cwd=BACKEND_DIR,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

        self.assertEqual(url_probe.returncode, 0, url_probe.stderr)
        url = urlparse(url_probe.stdout.strip())
        query = parse_qs(url.query)
        self.assertEqual(url.scheme, 'https')
        self.assertEqual(url.netloc, 'storage.example.test')
        self.assertIn('/gestion-saude-media/test.webp', url.path)
        self.assertIn('X-Amz-Signature', query)
        self.assertEqual(query['X-Amz-Expires'], ['604800'])
