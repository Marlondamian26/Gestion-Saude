"""
Utilidades para procesamiento de imágenes (§5.2).

Valida MIME real con Pillow, redimensiona y convierte a WebP.
No confiamos en el Content-Type del cliente ni en la extensión.
"""
import logging
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.files.images import get_image_dimensions
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger(__name__)

MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5MB default
FORMATO_SALIDA = 'WEBP'
CALIDAD_WEBP = 85


def validar_imagen(archivo, max_bytes=MAX_UPLOAD_BYTES):
    """
    Valida que el archivo es una imagen real (no spoofing).
    Lanza ValueError si falla.
    """
    if not archivo:
        raise ValueError('No se proporcionó archivo')

    if archivo.size > max_bytes:
        raise ValueError(f'Imagen supera el límite de {max_bytes // (1024*1024)}MB')

    try:
        with Image.open(archivo) as img:
            img.verify()
    except (UnidentifiedImageError, Exception) as e:
        raise ValueError('El archivo no es una imagen válida o está corrupto')

    archivo.seek(0)
    return True


def optimizar_imagen(archivo, target_size=(512, 512), calidad=CALIDAD_WEBP,
                     formato=FORMATO_SALIDA, max_bytes=MAX_UPLOAD_BYTES):
    """
    Valida, redimensiona (crop centrado) y convierte a WebP.
    Devuelve un ContentFile con la imagen optimizada.
    """
    if archivo.size > max_bytes:
        raise ValueError(f'Imagen supera el límite de {max_bytes // (1024*1024)}MB')

    try:
        with Image.open(archivo) as img:
            img.verify()
        archivo.seek(0)
        with Image.open(archivo) as img:
            # Corregir orientación EXIF
            img = ImageOps.exif_transpose(img)

            # Convertir a RGB si es necesario (WebP no soporta todos los modos)
            if img.mode not in ('RGB', 'RGBA'):
                img = img.convert('RGB')

            # Resize con crop centrado
            img = ImageOps.fit(img, target_size, Image.Resampling.LANCZOS)

            buffer = BytesIO()
            img.save(buffer, format=formato, quality=calidad, optimize=True)
            buffer.seek(0)

            nombre_base = archivo.name.rsplit('.', 1)[0] if '.' in archivo.name else 'imagen'
            return ContentFile(buffer.read(), name=f"{nombre_base}.webp")
    except UnidentifiedImageError:
        raise ValueError('El archivo no es una imagen válida')
    except Exception as e:
        logger.error(f'Error procesando imagen: {e}')
        raise ValueError('Error al procesar la imagen')


def validar_dimensiones(archivo):
    """Devuelve (width, height) sin procesar la imagen."""
    return get_image_dimensions(archivo)
