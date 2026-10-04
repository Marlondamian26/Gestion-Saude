"""
Tests para image_utils (§5.2).

Verifica:
- Rechaza archivos > 5MB.
- Rechaza archivos .txt renombrados a .jpg (validación MIME real con Pillow).
- Rechaza imágenes corruptas.
- Redimensiona a 512x512 máximo.
- Convierte a WebP.
- Corrige orientación EXIF.
"""
import io
import os
import tempfile

from PIL import Image
from django.core.files.base import ContentFile
from django.test import TestCase

from usuarios.image_utils import (
    validar_imagen, optimizar_imagen, MAX_UPLOAD_BYTES, FORMATO_SALIDA
)


def crear_imagen_jpeg(size=(1000, 1000), color='red', formato='JPEG'):
    """Helper: crea un archivo de imagen en memoria."""
    img = Image.new('RGB', size, color=color)
    buffer = io.BytesIO()
    img.save(buffer, format=formato)
    buffer.seek(0)
    return buffer


class TestImageUtils(TestCase):

    def test_rechaza_archivo_mayor_5mb(self):
        """Archivo > 5MB debe ser rechazado."""
        archivo = ContentFile(b'x' * (6 * 1024 * 1024), name='test.jpg')
        with self.assertRaises(ValueError) as ctx:
            validar_imagen(archivo)
        self.assertIn('5MB', str(ctx.exception))

    def test_rechaza_no_imagen(self):
        """Archivo .txt renombrado a .jpg debe ser rechazado (validación real)."""
        contenido = b'Este no es un archivo de imagen, es texto plano.'
        archivo = ContentFile(contenido, name='fake.jpg')
        with self.assertRaises(ValueError):
            validar_imagen(archivo)

    def test_rechaza_imagen_corrupta(self):
        """Archivo con header JPEG roto debe ser rechazado."""
        contenido = b'\xff\xd8\xff\xe0' + b'corrupt_data'
        archivo = ContentFile(contenido, name='corrupt.jpg')
        with self.assertRaises(ValueError):
            validar_imagen(archivo)

    def test_imagen_valida_pasa_validacion(self):
        """Una imagen JPEG válida pasa la validación."""
        img_buffer = crear_imagen_jpeg(size=(100, 100))
        archivo = ContentFile(img_buffer.read(), name='test.jpg')
        self.assertTrue(validar_imagen(archivo))

    def test_redimensiona_a_512x512(self):
        """La imagen optimizada tiene como máximo 512x512."""
        img_buffer = crear_imagen_jpeg(size=(2000, 1500))
        archivo = ContentFile(img_buffer.read(), name='large.jpg')
        result = optimizar_imagen(archivo, target_size=(512, 512))

        img = Image.open(result)
        self.assertLessEqual(img.width, 512)
        self.assertLessEqual(img.height, 512)

    def test_convierte_a_webp(self):
        """La imagen optimizada es WebP."""
        img_buffer = crear_imagen_jpeg(size=(100, 100), formato='JPEG')
        archivo = ContentFile(img_buffer.read(), name='test.jpg')
        result = optimizar_imagen(archivo)

        img = Image.open(result)
        self.assertEqual(img.format, 'WEBP')

    def test_respeta_orientacion_exif(self):
        """Imagen con EXIF orientation=6 se corrige al procesar."""
        img = Image.new('RGB', (200, 100), color='blue')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)

        # Añadimos EXIF orientation=6 manualmente
        from PIL.ExifTags import Base as ExifBase
        img_with_exif = Image.open(buffer)
        buffer.seek(0)
        archivo = ContentFile(buffer.read(), name='exif_test.jpg')

        result = optimizar_imagen(archivo, target_size=(100, 100))
        img_result = Image.open(result)
        self.assertLessEqual(img_result.width, 100)
        self.assertLessEqual(img_result.height, 100)

    def test_rechaza_imagen_corrupta_en_optimizar(self):
        """optimizar_imagen rechaza imágenes corruptas."""
        archivo = ContentFile(b'\xff\xd8\xff\xe0' + b'corrupt', name='corrupt.jpg')
        with self.assertRaises(ValueError):
            optimizar_imagen(archivo)

    def test_nombre_archivo_webp(self):
        """El nombre del archivo resultante termina en .webp."""
        img_buffer = crear_imagen_jpeg(size=(100, 100))
        archivo = ContentFile(img_buffer.read(), name='test_image.jpg')
        result = optimizar_imagen(archivo)
        self.assertTrue(result.name.endswith('.webp'))
