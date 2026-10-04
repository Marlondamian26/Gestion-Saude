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
from io import BytesIO
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db import transaction

from usuarios.models import Usuario, SitioImagen
from usuarios.image_utils import validar_imagen, optimizar_imagen

logger = __import__('logging').getLogger(__name__)


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
            file_path = u.foto_perfil.name
            storage_path = u.foto_perfil.path if hasattr(u.foto_perfil, 'path') else None

            if not storage_path or not os.path.exists(storage_path):
                continue

            size = os.path.getsize(storage_path)
            is_webp = file_path.lower().endswith('.webp')

            if size <= 5 * 1024 * 1024 and is_webp:
                continue  # ya está optimizada

            self.stdout.write(f"  {u.username}: {size//1024}KB → optimizar")
            optimizados += 1

            if not dry_run:
                try:
                    with open(storage_path, 'rb') as f:
                        content_file = ContentFile(f.read(), name=os.path.basename(file_path))
                        optimized = optimizar_imagen(content_file, target_size=(512, 512))

                    # Reemplazar archivo
                    old_name = u.foto_perfil.name
                    u.foto_perfil.save(os.path.basename(old_name).replace('.jpg', '.webp').replace('.png', '.webp'), optimized, save=True)
                    u.save()

                    # Borrar archivo antiguo
                    old_path = os.path.join(os.path.dirname(storage_path), os.path.basename(old_name))
                    if old_path != u.foto_perfil.path and os.path.exists(old_path):
                        os.remove(old_path)

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"    ERROR: {e}"))
                    continue

        self.stdout.write(self.style.SUCCESS(
            f"Foto perfil: {optimizados}/{total} optimizadas"
        ))

        # --- Imágenes de sitio ---
        imagenes = SitioImagen.objects.exclude(imagen='')
        total_site = imagenes.count()
        self.stdout.write(f"\nSitioImagen: {total_site} imágenes")

        optimizados_site = 0
        for img in imagenes.iterator():
            storage_path = img.imagen.path if hasattr(img.imagen, 'path') else None
            if not storage_path or not os.path.exists(storage_path):
                continue

            size = os.path.getsize(storage_path)
            is_webp = img.imagen.name.lower().endswith('.webp')

            if size <= 10 * 1024 * 1024 and is_webp:
                continue

            self.stdout.write(f"  {img.titulo}: {size//1024}KB → optimizar")
            optimizados_site += 1

            if not dry_run:
                try:
                    with open(storage_path, 'rb') as f:
                        content_file = ContentFile(f.read(), name=os.path.basename(img.imagen.name))
                        target = (1920, 1080) if img.tipo == 'hero' else (1200, 800)
                        optimized = optimizar_imagen(content_file, target_size=target, max_bytes=10*1024*1024)

                    old_name = img.imagen.name
                    img.imagen.save(os.path.basename(old_name).replace('.jpg', '.webp').replace('.png', '.webp'), optimized, save=True)

                    old_path = storage_path
                    if old_path != img.imagen.path and os.path.exists(old_path):
                        os.remove(old_path)

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"    ERROR: {e}"))
                    continue

        self.stdout.write(self.style.SUCCESS(
            f"SitioImagen: {optimizados_site}/{total_site} optimizadas"
        ))

        if dry_run:
            self.stdout.write(self.style.WARNING(
                "\n[DRY-RUN] Usa --apply para aplicar los cambios"
            ))
