from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from usuarios.models import Usuario

class Notificacion(models.Model):
    TIPOS = (
        ('recordatorio_cita', 'Recordatorio de Cita'),
        ('confirmacion_cita', 'Confirmación de Cita'),
        ('cancelacion_cita', 'Cancelación de Cita'),
        ('nueva_cita', 'Nueva Cita'),
        ('modificacion_cita', 'Modificación de Cita'),
        ('disponibilidad_doctor', 'Disponibilidad de Doctor'),
    )
    
    ESTADOS = (
        ('pendiente', 'Pendiente'),
        ('enviada', 'Enviada'),
        ('fallida', 'Fallida'),
    )
    
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=30, choices=TIPOS)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    estado = models.CharField(max_length=20, choices=ESTADOS, default='pendiente')
    intentos = models.PositiveIntegerField(default=0, verbose_name='Número de intentos de envío')

    # Para relacionar con cualquier modelo (cita, etc.)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    contenido_relacionado = GenericForeignKey('content_type', 'object_id')
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_creacion']
        
    def __str__(self):
        return f"{self.titulo} - {self.usuario.username}"