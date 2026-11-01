import tempfile
from pathlib import Path
from unittest.mock import patch

from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings

from usuarios.management.commands import migrate_media_to_s3
from usuarios.models import Usuario


class FakeDestinationStorage:
    def __init__(self):
        self.names = set()

    def exists(self, name):
        return name in self.names

    def save(self, name, content):
        destination_name = f'remote/{name}'
        self.names.add(destination_name)
        return destination_name


class TestMigrateMediaToS3(TestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_dir.cleanup)
        self.override = override_settings(MEDIA_ROOT=Path(self.media_dir.name))
        self.override.enable()
        self.addCleanup(self.override.disable)
        self.user = Usuario.objects.create_user(
            username='media-user',
            password='TestPass123!',
            rol='doctor',
        )
        self.filename = 'perfiles/media-user.webp'
        source = FileSystemStorage(location=self.media_dir.name)
        source.save(self.filename, ContentFile(b'test image'))
        Usuario.objects.filter(pk=self.user.pk).update(foto_perfil=self.filename)

    def test_dry_run_lista_media_local_sin_requerir_s3(self):
        output = []
        call_command(
            'migrate_media_to_s3',
            '--dry-run',
            '--model',
            'usuarios',
            stdout=self._output_writer(output),
        )

        self.assertTrue(any('[DRY] Usuario#' in line for line in output))
        self.assertTrue(any('Modo: DRY-RUN' in line for line in output))

    def test_apply_falla_si_no_esta_configurado_s3(self):
        with override_settings(MEDIA_STORAGE='filesystem'):
            with self.assertRaisesMessage(CommandError, 'MEDIA_STORAGE=s3'):
                call_command('migrate_media_to_s3', '--apply')

    def test_apply_es_idempotente_y_actualiza_la_referencia(self):
        destination = FakeDestinationStorage()
        with (
            override_settings(MEDIA_STORAGE='s3'),
            patch.object(migrate_media_to_s3, 'default_storage', destination),
        ):
            call_command('migrate_media_to_s3', '--apply', '--model', 'usuarios')
            self.user.refresh_from_db()
            self.assertEqual(self.user.foto_perfil.name, f'remote/{self.filename}')

            output = []
            call_command(
                'migrate_media_to_s3',
                '--apply',
                '--model',
                'usuarios',
                stdout=self._output_writer(output),
            )

        self.assertTrue(any('[SKIP] Ya existe en destino' in line for line in output))
        self.assertEqual(destination.names, {f'remote/{self.filename}'})

    @staticmethod
    def _output_writer(lines):
        class Writer:
            def write(self, text):
                lines.append(text)

        return Writer()
