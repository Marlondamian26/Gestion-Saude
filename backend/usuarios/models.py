from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Usuario(AbstractUser):
    """
    Modelo personalizado de usuario.
    """
    
    # Roles posibles en el sistema
    ROLES = (
        ('admin', 'Administrador'),
        ('doctor', 'Médico'),
        ('nurse', 'Enfermería'),
        ('patient', 'Paciente'),
    )
    
    # Campos adicionales
    rol = models.CharField(
        max_length=10, 
        choices=ROLES, 
        default='patient',
        verbose_name='Rol del usuario'
    )
    telefono = models.CharField(
        max_length=20, 
        blank=True, 
        verbose_name='Teléfono de contacto'
    )
    foto_perfil = models.ImageField(
        upload_to='perfiles/', 
        blank=True, 
        null=True,
        verbose_name='Foto de perfil'
    )
    fecha_nacimiento = models.DateField(
        blank=True, 
        null=True,
        verbose_name='Fecha de nacimiento'
    )
    # Hacer email opcional pero único (null=True para DB, blank=True para formularios)
    email = models.EmailField(unique=True, null=True, blank=True, verbose_name='Correo electrónico')
    
    # ✅ Solucionar conflictos de related_name
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='usuarios_groups',
        blank=True,
        verbose_name='groups',
        help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='usuarios_permissions',
        blank=True,
        verbose_name='user permissions',
        help_text='Specific permissions for this user.'
    )
    
    def __str__(self):
        nombre = f"{self.first_name} {self.last_name}".strip()
        if not nombre:
            return self.username
        return f"{nombre} - {self.get_rol_display()}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        # [FASE 7 §7.1.4] Índice en rol para queries frecuentes de filtrado por rol
        indexes = [
            models.Index(fields=['rol'], name='usuario_rol_idx'),
        ]


# Señales
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='usuarios.Usuario')
def sincronizar_perfil_paciente(sender, instance, created, **kwargs):
    """
    Sincroniza el perfil de Paciente con el rol del Usuario.

    Políticas (§3.4):
    - P1 (Creación): Si rol == 'patient', crea Paciente.
      Idempotente: get_or_create evita duplicados.
    - P2 (Cambio de rol): No elimina Paciente al cambiar rol 'patient' → otro.
      Mantiene historial de citas. Si vuelve a 'patient', el Paciente ya existe.
      El Paciente 'huérfano' permanece en BD (invisibilidad gestionada en frontend).
    - P3 (Eliminación): Usuario→Paciente es CASCADE (heredado).
      Cita.paciente/cita.doctor también son CASCADE — pendiente decisión negocio (FASE 7).
    """
    if instance.rol == 'patient' and instance.username != 'admin':
        Paciente.objects.get_or_create(usuario=instance)

class Especialidad(models.Model):
    """
    Catálogo de especialidades médicas y de enfermería
    """
    TIPO_ESPECIALIDAD = (
        ('medica', 'Especialidad Médica'),
        ('enfermeria', 'Especialidad de Enfermería'),
        ('ambas', 'Ambos tipos'),
    )
    
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    tipo_especialidad = models.CharField(
        max_length=20,
        choices=TIPO_ESPECIALIDAD,
        default='medica',
        verbose_name='Tipo de especialidad'
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = 'Especialidad'
        verbose_name_plural = 'Especialidades'
        ordering = ['nombre']


class Doctor(models.Model):
    """
    Información adicional específica para usuarios con rol=doctor
    """
    usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE,
        related_name='perfil_doctor',
        verbose_name='Usuario asociado'
    )
    especialidad = models.ForeignKey(
        Especialidad,
        on_delete=models.SET_NULL,
        null=True,
        blank=False,  # Obligatorio
        verbose_name='Especialidad médica',
        help_text='Selecciona la especialidad principal'
    )
    otra_especialidad = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Otra especialidad',
        help_text='Si no encuentras tu especialidad, escríbela aquí'
    )
    biografia = models.TextField(
        blank=True,
        verbose_name='Biografía profesional'
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        esp = self.especialidad.nombre if self.especialidad else self.otra_especialidad
        return f"Dr. {self.usuario.first_name} {self.usuario.last_name} - {esp or 'Sin especialidad'}"
    
    class Meta:
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctores'


class Enfermera(models.Model):
    """
    Información adicional específica para usuarios con rol=nurse
    """
    usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE,
        related_name='perfil_enfermera',
        verbose_name='Usuario asociado'
    )
    especialidad = models.ForeignKey(
        Especialidad,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='Especialidad de enfermería',
        help_text='Selecciona la especialidad (opcional)'
    )
    otra_especialidad = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Otra especialidad',
        help_text='Si no encuentras tu especialidad, escríbela aquí'
    )
    numero_licencia = models.CharField(
        max_length=50,
        blank=True,  # Ahora es opcional
        verbose_name='Número de licencia'
    )
    biografia = models.TextField(
        blank=True,
        verbose_name='Biografía profesional'
    )
    
    def __str__(self):
        return f"Enf. {self.usuario.first_name} {self.usuario.last_name}"
    
    class Meta:
        verbose_name = 'Enfermera'
        verbose_name_plural = 'Enfermeras'


class Paciente(models.Model):
    """
    Información adicional específica para usuarios con rol=patient
    """
    usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE,
        related_name='perfil_paciente',
        verbose_name='Usuario asociado'
    )
    alergias = models.TextField(
        blank=True,
        verbose_name='Alergias conocidas'
    )
    grupo_sanguineo = models.CharField(
        max_length=3,
        choices=(
            ('A+', 'A+'), ('A-', 'A-'),
            ('B+', 'B+'), ('B-', 'B-'),
            ('AB+', 'AB+'), ('AB-', 'AB-'),
            ('O+', 'O+'), ('O-', 'O-'),
        ),
        blank=True,
        verbose_name='Grupo sanguíneo'
    )
    contacto_emergencia = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Nombre contacto de emergencia'
    )
    telefono_emergencia = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='Teléfono de emergencia'
    )
    
    def __str__(self):
        return f"Paciente: {self.usuario.first_name} {self.usuario.last_name}"
    
    class Meta:
        verbose_name = 'Paciente'
        verbose_name_plural = 'Pacientes'


class Horario(models.Model):
    """
    Define los horarios de atención de un doctor
    """
    DIAS_SEMANA = (
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    )
    
    doctor = models.ForeignKey(
        Doctor, 
        on_delete=models.CASCADE,
        related_name='horarios',
        verbose_name='Doctor'
    )
    dia_semana = models.IntegerField(choices=DIAS_SEMANA)
    hora_inicio = models.TimeField(verbose_name='Hora de inicio')
    hora_fin = models.TimeField(verbose_name='Hora de fin')
    activo = models.BooleanField(default=True, verbose_name='Horario activo')
    
    class Meta:
        unique_together = ['doctor', 'dia_semana', 'hora_inicio', 'hora_fin']
        ordering = ['doctor', 'dia_semana', 'hora_inicio']
        verbose_name = 'Horario'
        verbose_name_plural = 'Horarios'
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(hora_fin__lte=models.F('hora_inicio')),
                name='horario_hora_fin_mayor_inicio',
            ),
        ]
        # [FASE 7 §7.1.4] Índice compuesto para consulta de horarios disponibles por doctor + día
        indexes = [
            models.Index(fields=['doctor', 'dia_semana', 'activo'], name='horario_doc_dia_activo_idx'),
        ]
    
    def __str__(self):
        dias = dict(self.DIAS_SEMANA)
        return f"{self.doctor} - {dias[self.dia_semana]} {self.hora_inicio}-{self.hora_fin}"


class Cita(models.Model):
    """
    Representa una cita médica
    """
    ESTADOS = (
        ('pendiente', 'Pendiente de confirmación'),
        ('confirmada', 'Confirmada'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
        ('no_asistio', 'No asistió'),
    )
    
    paciente = models.ForeignKey(
        Paciente, 
        on_delete=models.CASCADE,
        related_name='citas',
        verbose_name='Paciente'
    )
    doctor = models.ForeignKey(
        Doctor, 
        on_delete=models.CASCADE,
        related_name='citas',
        verbose_name='Doctor'
    )
    fecha = models.DateField(verbose_name='Fecha de la cita')
    hora = models.TimeField(verbose_name='Hora de la cita')
    estado = models.CharField(
        max_length=15,
        choices=ESTADOS,
        default='pendiente',
        verbose_name='Estado de la cita'
    )
    motivo = models.TextField(
        blank=True,
        verbose_name='Motivo de la consulta'
    )
    notas_adicionales = models.TextField(
        blank=True,
        verbose_name='Notas internas (solo staff)'
    )
    duracion_minutos = models.PositiveIntegerField(
        default=30,
        validators=[MinValueValidator(10), MaxValueValidator(240)],
        verbose_name='Duración en minutos',
        help_text='Duración de la cita. Default: 30 minutos.',
    )
    fecha_creacion = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    fecha_actualizacion = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )
    
    class Meta:
        ordering = ['fecha', 'hora']
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        constraints = [
            # Unique para citas activas (no canceladas) — permite rebooking de slots liberados
            models.UniqueConstraint(
                fields=['doctor', 'fecha', 'hora'],
                condition=~models.Q(estado='cancelada'),
                name='cita_unique_activa',
            ),
        ]
        # [FASE 7 §7.1.4] Índices para queries frecuentes: overlap check, filtrado por doctor/paciente/fecha
        indexes = [
            models.Index(fields=['doctor', 'fecha', 'estado'], name='cita_doc_fecha_estado_idx'),
            models.Index(fields=['paciente', 'fecha'], name='cita_paciente_fecha_idx'),
        ]
    
    def __str__(self):
        return f"{self.paciente} con {self.doctor} - {self.fecha} {self.hora}"


class SitioImagen(models.Model):
    """
    Imágenes para el sitio promocional (carrusel, hero, etc.)
    """
    TIPO_IMAGEN = (
        ('hero', 'Imagen Hero (Inicio)'),
        ('carousel', 'Carrusel'),
        ('galeria', 'Galería'),
    )
    
    titulo = models.CharField(max_length=500, blank=True, verbose_name='Título')
    descripcion = models.TextField(blank=True, verbose_name='Descripción')
    imagen = models.ImageField(upload_to='', verbose_name='Archivo de imagen')
    tipo = models.CharField(max_length=20, choices=TIPO_IMAGEN, default='carousel')
    orden = models.IntegerField(default=0, verbose_name='Orden de visualización')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['tipo', 'orden', '-fecha_creacion']
        verbose_name = 'Imagen del Sitio'
        verbose_name_plural = 'Imágenes del Sitio'
    
    def __str__(self):
        return f"{self.tipo} - {self.titulo or self.imagen.name}"




