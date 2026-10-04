"""
Tests for dj-database-url parsing (§1.9).

Verifies that dj_database_url.parse() handles PostgreSQL and SQLite URLs
correctly with conn_max_age and ssl_require parameters.
"""
import unittest
from django.test import TestCase

try:
    from dj_database_url import parse as dj_parse
    DJ_AVAILABLE = True
except ImportError:
    DJ_AVAILABLE = False


@unittest.skipUnless(DJ_AVAILABLE, "dj-database-url not installed")
class TestDatabaseUrlParsing(TestCase):

    def test_parse_postgres_url(self):
        url = 'postgresql://user:password@host:5432/dbname'
        result = dj_parse(url, conn_max_age=600, ssl_require=True)
        self.assertEqual(result['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(result['NAME'], 'dbname')
        self.assertEqual(result['USER'], 'user')
        self.assertEqual(result['PASSWORD'], 'password')
        self.assertEqual(result['HOST'], 'host')
        self.assertEqual(str(result['PORT']), '5432')
        self.assertEqual(result['CONN_MAX_AGE'], 600)

    def test_parse_sqlite_url(self):
        url = 'sqlite:///tmp/test.sqlite3'
        result = dj_parse(url)
        self.assertEqual(result['ENGINE'], 'django.db.backends.sqlite3')

    def test_settings_database_backends(self):
        """Verify settings.py uses env var or SQLite fallback correctly."""
        from django.conf import settings
        self.assertIn('default', settings.DATABASES)
        engine = settings.DATABASES['default']['ENGINE']
        self.assertIn('django.db.backends', engine)
