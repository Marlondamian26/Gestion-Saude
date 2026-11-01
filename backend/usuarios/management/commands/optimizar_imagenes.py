"""
Management command: optimizar_imagenes

Re-procesa imágenes de perfil y sitio que superan el límite nuevo (5MB / 10MB)
o que no están en WebP. Por defecto hace dry-run.

Uso:
    python manage.py optimizar_imagenes            # dry-run
    python manage.py optimizar_imagenes --apply     # aplicar cambios

[REQUIERE ACCIÓN MANUAL] ejecutar en prod con --apply tras aprobación.
"""
import os
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils import timezone

from usuarios.models import Usuario, SitioImagen
from usuarios.image_utils import optimizar_imagen


class Command(BaseCommand):
    help = '[FASE 5 §5.2] Re-procesar imágenes de perfil y sitio a WebP optimizado'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply', action='store_true',
            help='Aplicar cambios (por defecto dry-run)'
        )
        parser.add_argument(
            '--max-edad-dias', type=int, default=0,
            help='Solo optimizar imágenes modificadas en los últimos N días'
        )

    def _optimizar_archivo(self, instance, field_name, target_size, max_bytes):
        image = getattr(instance, field_name)
        old_name = image.name
        try:
            with image.open('rb') as source:
                content_file = ContentFile(
                    source.read(),
                    name=os.path.basename(old_name),
                )
                optimized = optimizar_imagen(
                    content_file,
                    target_size=target_size,
                    max_bytes=max_bytes,
                )

            base_name = os.path.splitext(os.path.basename(old_name))[0]
            image.save(f'{base_name}.webp', optimized, save=False)
            new_name = image.name
            instance.save(update_fields=[field_name])
            if new_name != old_name:
                image.storage.delete(old_name)
            return True
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"    ERROR: {exc}"))
            return False

    def handle(self, *args, **options):
        apply = options['apply']
        max_edad = options['max_edad_dias']
        dry_run = not apply

        self.stdout.write(self.style.WARNING(
            f"Modo: {'APPLY' if apply else 'DRY-RUN'}"
        ))

        # --- Fotos de perfil ---
        desde = timezone.now() - timedelta(days=max_edad) if max_edad else None
        usuarios = Usuario.objects.exclude(foto_perfil='')
        if desde:
            usuarios = usuarios.filter(fecha_actualizacion__gte=desde)

        total = usuarios.count()
        self.stdout.write(f"\nFoto perfil: {total} usuarios con foto")

        optimizados = 0
        for u in usuarios.iterator():
            image = u.foto_perfil
            if not image.name:
                continue

            size = image.size
            is_webp = image.name.lower().endswith('.webp')

            if size <= 5 * 1024 * 1024 and is_webp:
                continue  # ya está optimizada

            self.stdout.write(f"  {u.username}: {size//1024}KB → optimizar")
            optimizados += 1

            if not dry_run:
                self._optimizar_archivo(
                    u,
                    'foto_perfil',
                    target_size=(512, 512),
                    max_bytes=5 * 1024 * 1024,
                )

        self.stdout.write(self.style.SUCCESS(
            f"Foto perfil: {optimizados}/{total} optimizadas"
        ))

        # --- Imágenes de sitio ---
        imagenes = SitioImagen.objects.exclude(imagen='')
        total_site = imagenes.count()
        self.stdout.write(f"\nSitioImagen: {total_site} imágenes")

        optimizados_site = 0

        for img in imagenes.iterator():
            image = img.imagen
            if not image.name:
                continue

            size = image.size
            is_webp = image.name.lower().endswith('.webp')

            if size <= 10 * 1024 * 1024 and is_webp:
                continue

            self.stdout.write(f"  {img.titulo}: {size//1024}KB → optimizar")
            optimizados_site += 1

            if not dry_run:
                target = (1920, 1080) if img.tipo == 'hero' else (1200, 800)
                self._optimizar_archivo(
                    img,
                    'imagen',
                    target_size=target,
                    max_bytes=10 * 1024 * 1024,
                )

        self.stdout.write(self.style.SUCCESS(
            f"SitioImagen: {optimizados_site}/{total_site} optimizadas"
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                "\n[DRY-RUN] Usa --apply para aplicar los cambios"
            ))
