"""
Tests for static and media path separation (§2.4).

Verifies:
- STATIC_ROOT and MEDIA_ROOT are distinct directories.
- Neither is a subdirectory of the other.
- MEDIA_URL does not conflict with STATIC_URL.
- collectstatic target (STATIC_ROOT) is not inside MEDIA_ROOT.
"""
from pathlib import Path

from django.test import TestCase
from django.conf import settings


class TestStaticMediaPaths(TestCase):
    """Pruebas de separación de paths estáticos y media."""

    def test_static_root_and_media_root_distinct(self):
        """STATIC_ROOT y MEDIA_ROOT deben ser distintos."""
        self.assertNotEqual(settings.STATIC_ROOT, settings.MEDIA_ROOT)

    def test_static_root_not_inside_media_root(self):
        """STATIC_ROOT no debe estar dentro de MEDIA_ROOT."""
        static_parts = Path(str(settings.STATIC_ROOT)).parts
        media_parts = Path(str(settings.MEDIA_ROOT)).parts
        for i in range(len(static_parts) - len(media_parts) + 1):
            if static_parts[i:i + len(media_parts)] == media_parts:
                self.fail(f"STATIC_ROOT ({settings.STATIC_ROOT}) está dentro de MEDIA_ROOT ({settings.MEDIA_ROOT})")

    def test_media_root_not_inside_static_root(self):
        """MEDIA_ROOT no debe estar dentro de STATIC_ROOT."""
        static_parts = Path(str(settings.STATIC_ROOT)).parts
        media_parts = Path(str(settings.MEDIA_ROOT)).parts
        for i in range(len(media_parts) - len(static_parts) + 1):
            if media_parts[i:i + len(static_parts)] == static_parts:
                self.fail(f"MEDIA_ROOT ({settings.MEDIA_ROOT}) está dentro de STATIC_ROOT ({settings.STATIC_ROOT})")

    def test_media_url_not_sitio(self):
        """MEDIA_URL ya no debe ser '/sitio/' (legacy)."""
        self.assertNotEqual(settings.MEDIA_URL, '/sitio/')
        self.assertTrue(settings.MEDIA_URL.startswith('/media'))

    def test_static_url_starts_with_slash(self):
        """STATIC_URL debe empezar con '/' para URLs absolutas."""
        self.assertTrue(settings.STATIC_URL.startswith('/'))

    def test_no_template_dirs_pointing_to_sitio(self):
        """TEMPLATES DIRS no debe apuntar a 'sitio/'."""
        for t in settings.TEMPLATES:
            for d in t.get('DIRS', []):
                self.assertNotIn('sitio', str(d))
