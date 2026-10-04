"""
Management command: migrate_media_to_s3

Migra archivos existentes de MEDIA_ROOT (FileSystemStorage) a S3-compatible storage.
SOLO ejecutar después de activar MEDIA_STORAGE=s3 y provisionar bucket.

Modo:
  --dry-run (default): muestra qué se migraría sin tocar nada.
  --apply: ejecuta la migración real.

Uso:
  python manage.py migrate_media_to_s3 --dry-run
  python manage.py migrate_media_to_s3 --apply
"""
import logging
import os
from pathlib import Path

from django.core.files.storage import default_storage, FileSystemStorage
from django.core.management.base import BaseCommand, CommandError

from usuarios.models import Usuario, SitioImagen

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '[FASE 7 §7.4.5] Migrar archivos de MEDIA_ROOT a S3 (modo dry-run por defecto)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Ejecutar la migración real (por defecto es dry-run)'
        )
        parser.add_argument(
            '--bucket-prefix',
            type=str,
            default='media/',
            help='Prefijo de carpetas en el bucket S3 (default: media/)'
        )

    def handle(self, *args, **options):
        if not options['apply']:
            self.stdout.write(self.style.WARNING(
                '[DRY RUN] No se escribirán cambios. Usa --apply para ejecutar.'
            ))

        if not os.environ.get('MEDIA_STORAGE') == 's3':
            raise CommandError(
                '[FASE 7 §7.4] MEDIA_STORAGE no es s3. '
                'Setear MEDIA_STORAGE=s3 y provisionar credenciales antes de migrar.'
            )

        # Contar objetos
        usuarios_con_foto = Usuario.objects.exclude(foto_perfil='')
        sitio_con_imagen = SitioImagen.objects.exclude(imagen='')

        total = usuarios_con_foto.count() + sitio_con_imagen.count()
        self.stdout.write(f'\nObjetos a migrar: {total}')

        migrated = 0
        errors = 0

        # Migrar fotos de perfil
        for usuario in usuarios_con_foto.iterator():
            if not usuario.foto_perfil.name:
                continue

            old_path = usuario.foto_perfil.name
            old_storage = FileSystemStorage()

            try:
                if not old_storage.exists(old_path):
                    self.stdout.write(self.style.WARNING(
                        f'  ⚠  Archivo no encontrado en disco: {old_path}'
                    ))
                    errors += 1
                    continue

                # Leer contenido del archivo
                with old_storage.open(old_path) as f:
                    file_data = f.read()

                if options['apply']:
                    # Upload to default (S3) storage
                    new_name = default_storage.save(old_path, file_data)
                    # Update DB reference
                    Usuario.objects.filter(id=usuario.id).update(foto_perfil=new_name)
                    self.stdout.write(self.style.SUCCESS(
                        f'  ✓ Foto de perfil migrada: {old_path} → {new_name}'
                    ))
                else:
                    self.stdout.write(f'  → Foto de perfil: {old_path}')

                migrated += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  ✗ Error migrando {old_path}: {e}'
                ))
                errors += 1

        # Migrar imágenes del sitio promocional
        for imagen in sitio_con_imagen.iterator():
            old_path = imagen.imagen.name
            old_storage = FileSystemStorage()

            try:
                if not old_storage.exists(old_path):
                    self.stdout.write(self.style.WARNING(
                        f'  ⚠  Archivo no encontrado en disco: {old_path}'
                    ))
                    errors += 1
                    continue

                with old_storage.open(old_path) as f:
                    file_data = f.read()

                if options['apply']:
                    new_name = default_storage.save(old_path, file_data)
                    SitioImagen.objects.filter(id=imagen.id).update(imagen=new_name)
                    self.stdout.write(self.style.SUCCESS(
                        f'  ✓ Imagen de sitio migrada: {old_path} → {new_name}'
                    ))
                else:
                    self.stdout.write(f'  → Imagen de sitio: {old_path}')

                migrated += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  ✗ Error migrando {old_path}: {e}'
                ))
                errors += 1

        # Resumen
        self.stdout.write(self.style.SUCCESS(
            f'\nResumen: {migrated}/{total} migrados, {errors} errores'
        ))

        if not options['apply'] and migrated > 0:
            self.stdout.write(self.style.WARNING(
                '\nUsa --apply para ejecutar esta migración.'
            ))

        if errors > 0:
            self.stdout.write(self.style.WARNING(
                f'\n[{errors}] errores encontrados. Revisa manualmente.'
            ))
