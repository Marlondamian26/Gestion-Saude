from io import BytesIO
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.test import SimpleTestCase

from usuarios.management.commands.optimizar_imagenes import Command


class FakeStorage:
    def __init__(self):
        self.saved = {}
        self.deleted = []

    def save(self, name, content):
        self.saved[name] = content.read()
        return name

    def delete(self, name):
        self.deleted.append(name)


class FakeImageField:
    def __init__(self, storage, name):
        self.storage = storage
        self.name = name

    def open(self, mode):
        return BytesIO(b'original image')

    def save(self, name, content, save=True):
        directory = self.name.rsplit('/', 1)[0]
        self.name = self.storage.save(f'{directory}/{name}', content)


class FakeImageModel:
    def __init__(self):
        self.imagen = FakeImageField(FakeStorage(), 'site/hero.png')
        self.saved_fields = None

    def save(self, update_fields=None):
        self.saved_fields = update_fields


class TestOptimizarImagenesStorage(SimpleTestCase):
    @patch(
        'usuarios.management.commands.optimizar_imagenes.optimizar_imagen',
        return_value=ContentFile(b'optimized webp'),
    )
    def test_optimiza_archivo_sin_requerir_path_local(self, optimize):
        image = FakeImageModel()

        result = Command()._optimizar_archivo(
            image,
            'imagen',
            target_size=(1920, 1080),
            max_bytes=10 * 1024 * 1024,
        )

        self.assertTrue(result)
        self.assertEqual(image.imagen.name, 'site/hero.webp')
        self.assertEqual(image.saved_fields, ['imagen'])
        self.assertEqual(image.imagen.storage.deleted, ['site/hero.png'])
        self.assertEqual(
            image.imagen.storage.saved['site/hero.webp'],
            b'optimized webp',
        )
        optimize.assert_called_once()
