"""
Copy existing MEDIA_ROOT files to the configured S3-compatible storage.

Dry-run is the default and works with local filesystem settings. Use --apply
only after MEDIA_STORAGE=s3 is configured and the target bucket is ready.
"""
from django.conf import settings
from django.core.files.storage import FileSystemStorage, default_storage
from django.core.management.base import BaseCommand, CommandError

from usuarios.models import SitioImagen, Usuario


class Command(BaseCommand):
    help = 'Migra media de MEDIA_ROOT a Supabase Storage (dry-run por defecto)'

    def add_arguments(self, parser):
        mode = parser.add_mutually_exclusive_group()
        mode.add_argument(
            '--apply',
            action='store_true',
            help='Copiar archivos al storage S3 y actualizar sus referencias',
        )
        mode.add_argument(
            '--dry-run',
            action='store_true',
            help='Listar archivos locales sin realizar cambios (opción por defecto)',
        )
        parser.add_argument(
            '--model',
            choices=['usuarios', 'sitio', 'all'],
            default='all',
            help='Limitar la migración a fotos de usuario o imágenes del sitio',
        )

    def handle(self, *args, **options):
        apply = options['apply']
        if apply and settings.MEDIA_STORAGE != 's3':
            raise CommandError(
                'Para aplicar la migración, configura MEDIA_STORAGE=s3 y las '
                'credenciales de Supabase Storage.'
            )

        source_storage = FileSystemStorage(location=settings.MEDIA_ROOT)
        sources = []
        if options['model'] in ('usuarios', 'all'):
            sources.append(
                (Usuario, 'foto_perfil', Usuario.objects.exclude(foto_perfil=''))
            )
        if options['model'] in ('sitio', 'all'):
            sources.append(
                (SitioImagen, 'imagen', SitioImagen.objects.exclude(imagen=''))
            )

        total = migrated = skipped = failed = 0
        for model, field_name, queryset in sources:
            for obj in queryset.iterator():
                field = getattr(obj, field_name)
                name = field.name
                if not name:
                    continue
                total += 1

                try:
                    if apply and default_storage.exists(name):
                        skipped += 1
                        self.stdout.write(f'  [SKIP] Ya existe en destino: {name}')
                        continue

                    if not source_storage.exists(name):
                        failed += 1
                        self.stderr.write(
                            self.style.ERROR(
                                f'  [ERROR] Archivo de origen no encontrado: {name}'
                            )
                        )
                        continue

                    if not apply:
                        self.stdout.write(f'  [DRY] {model.__name__}#{obj.pk}: {name}')
                        migrated += 1
                        continue

                    with source_storage.open(name, 'rb') as source:
                        destination_name = default_storage.save(name, source)
                    model.objects.filter(pk=obj.pk).update(
                        **{field_name: destination_name}
                    )
                    migrated += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  [OK] {model.__name__}#{obj.pk}: '
                            f'{name} -> {destination_name}'
                        )
                    )
                except Exception as exc:
                    failed += 1
                    self.stderr.write(
                        self.style.ERROR(
                            f'  [ERROR] {model.__name__}#{obj.pk} ({name}): {exc}'
                        )
                    )

        mode = 'APPLY' if apply else 'DRY-RUN'
        summary = (
            f'Total: {total} | Migradas/listadas: {migrated} | '
            f'Omitidas: {skipped} | Fallidas: {failed} | Modo: {mode}'
        )
        if failed:
            raise CommandError(summary)
        self.stdout.write(self.style.SUCCESS(summary))
