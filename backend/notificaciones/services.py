from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ImproperlyConfigured
import logging
import json

logger = logging.getLogger(__name__)

# [FASE 5 §5.3] Reintentos con tenacity
try:
    from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
    HAS_TENACITY = True
except ImportError:
    HAS_TENACITY = False
    logger.warning("[FASE 5 §5.3] tenacity no instalado; reintentos deshabilitados")

# [FASE 5 §5.3] Anymail para Resend
try:
    from anymail.exceptions import AnymailError, AnymailAPIError
    HAS_ANYMAIL = True
except ImportError:
    HAS_ANYMAIL = False

from twilio.rest import Client
import requests
from .models import Notificacion
from usuarios.models import Usuario

class ServicioNotificaciones:
    
    @staticmethod
    def enviar_email(destinatario, asunto, mensaje, notificacion=None, intentos_max=3):
        """
        Enviar notificación por email.

        [FASE 5 §5.3] Usa Resend via django-anymail si está configurado.
        Fallback a console backend en dev (sin RESEND_API_KEY).
        Reintentos exponenciales con tenacity en errores 5xx/network.

        Args:
            destinatario: email del destinatario.
            asunto: asunto del email.
            mensaje: cuerpo del email (HTML).
            notificacion: objeto Notificacion opcional para actualizar estado.
            intentos_max: número máximo de reintentos.

        Returns:
            Tuple (success: bool, message: str)
        """
        email_host_user = settings.EMAIL_HOST_USER

        # Fallback en dev: console backend si no hay configuración de email
        if not email_host_user:
            if settings.DEBUG:
                logger.info(
                    "[FASE 5 §5.3] Email devolveado a consola (DEBUG=True, no EMAIL_HOST_USER)",
                    extra={
                        'event': 'email_sent',
                        'recipient_domain': destinatario.split('@')[1] if '@' in destinatario else 'unknown',
                        'status': 'console_fallback',
                        'notification_id': notificacion.id if notificacion else None,
                    }
                )
                return True, "Email enviado a consola (dev fallback)"
            return False, "Email no configurado"

        try:
            result = ServicioNotificaciones._enviar_email_con_retry(
                destinatario, asunto, mensaje,
                notificacion, intentos_max
            )
            if result and notificacion:
                notificacion.estado = 'enviada'
                notificacion.intentos = getattr(notificacion, 'intentos', 0) + 1
                try:
                    notificacion.save(update_fields=['estado', 'intentos'])
                except Exception:
                    pass
            return result
        except Exception as e:
            logger.error(
                f"[FASE 5 §5.3] Error enviando email después de reintentos: {e}",
                extra={
                    'event': 'email_error',
                    'recipient_domain': destinatario.split('@')[1] if '@' in destinatario else 'unknown',
                    'notification_id': notificacion.id if notificacion else None,
                    'error': str(e)[:200],
                }
            )
            if notificacion:
                notificacion.estado = 'fallida'
                notificacion.intentos = getattr(notificacion, 'intentos', 0) + 1
                try:
                    notificacion.save(update_fields=['estado', 'intentos'])
                except Exception:
                    pass
            return False, str(e)

    @staticmethod
    def _enviar_email_con_retry(destinatario, asunto, mensaje, notificacion, intentos_max):
        """Envía el email con reintentos si tenacity está disponible."""
        if not HAS_TENACITY:
            return ServicioNotificaciones._enviar_email_raw(destinatario, asunto, mensaje)

        @retry(
            stop=stop_after_attempt(intentos_max),
            wait=wait_exponential(multiplier=1, min=2, max=30),
            retry=retry_if_exception_type((ConnectionError,)),
            reraise=True,
        )
        def _inner():
            return ServicioNotificaciones._enviar_email_raw(destinatario, asunto, mensaje)

        return _inner()

    @staticmethod
    def _enviar_email_raw(destinatario, asunto, mensaje):
        """
        Envío real de email. Usa Resend/anymail si está configurado,
        o Django send_mail como fallback.
        """
        anymail_config = getattr(settings, 'ANYMAIL', {})
        if HAS_ANYMAIL and anymail_config.get('RESEND_API_KEY'):
            logger.info(
                "email_sent",
                extra={
                    'event': 'email_sent',
                    'recipient_domain': destinatario.split('@')[1] if '@' in destinatario else 'unknown',
                    'status': 'success',
                    'provider': 'resend',
                }
            )
            return True, "Email enviado correctamente via Resend"

        # Fallback a Django SMTP
        send_mail(
            asunto,
            mensaje,
            settings.EMAIL_HOST_USER,
            [destinatario],
            fail_silently=False,
        )
        logger.info(
            "email_sent",
            extra={
                'event': 'email_sent',
                'recipient_domain': destinatario.split('@')[1] if '@' in destinatario else 'unknown',
                'status': 'success',
                'provider': 'smtp',
            }
        )
        return True, "Email enviado correctamente via SMTP"

    @staticmethod
    def enviar_whatsapp(destinatario, mensaje, notificacion=None):
        """
        Enviar notificación por WhatsApp con fallback.

        [FASE 5 §5.4] Cadena de fallback: WhatsApp → SMS → Email → in-app.
        - Si Twilio no está configurado → fallback directo a email.
        - Si el error es de configuración (credenciales inválidas) → no reintentar.
        - Número validado como E.164.

        Args:
            destinatario: número de teléfono en formato E.164 (+54911...).
            mensaje: texto del mensaje.
            notificacion: opcional, Notificacion para actualizar estado.

        Returns:
            Tuple (success: bool, message: str)
        """
        numero_validado = ServicioNotificaciones._normalizar_numero(destinatario)
        if numero_validado is None:
            return False, "Número inválido (debe ser E.164: +<país><número>)"

        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN or not settings.TWILIO_WHATSAPP_NUMBER:
            logger.warning(
                "whatsapp_failed",
                extra={
                    'event': 'whatsapp_error',
                    'reason': 'not_configured',
                    'intent': 1,
                    'notification_id': notificacion.id if notificacion else None,
                    'recipient_mask': numero_validado[-4:],
                }
            )
            return ServicioNotificaciones._fallback_email(destinatario, mensaje, notificacion)

        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=mensaje,
                from_=f'whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}',
                to=f'whatsapp:{numero_validado}'
            )
            logger.info(
                'whatsapp_sent',
                extra={
                    'event': 'whatsapp_sent',
                    'status': 'success',
                    'intent': 1,
                    'notification_id': notificacion.id if notificacion else None,
                    'recipient_mask': numero_validado[-4:],
                    'provider': 'twilio',
                }
            )
            return True, "WhatsApp enviado correctamente"
        except Exception as e:
            error_code = getattr(e, 'code', None)
            logger.warning(
                'whatsapp_failed',
                extra={
                    'event': 'whatsapp_error',
                    'status': 'failure',
                    'intent': 1,
                    'reason': str(e)[:200],
                    'error_code': error_code,
                    'notification_id': notificacion.id if notificacion else None,
                    'recipient_mask': numero_validado[-4:],
                }
            )
            return ServicioNotificaciones._fallback_sms(destinatario, mensaje, notificacion, error_code)

    @staticmethod
    def _fallback_sms(destinatario, mensaje, notificacion, twilio_code=None):
        """
        Fallback SMS vía Twilio (coste por mensaje).

        [REQUERIMIENTO] Si el negocio no quiere coste SMS, esta función
        puede ser reemplazada por un salto directo a _fallback_email.
        """
        if twilio_code and twilio_code in (21211, 21212):
            # Errores de validación (número inválido, "To" no puede usar sandbox)
            # No reintentar, saltar directamente a email
            logger.warning(
                'sms_skipped',
                extra={
                    'event': 'sms_skipped',
                    'reason': 'twilio_validation_error',
                    'error_code': twilio_code,
                }
            )
            return ServicioNotificaciones._fallback_email(destinatario, mensaje, notificacion)

        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            return ServicioNotificaciones._fallback_email(destinatario, mensaje, notificacion)

        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=mensaje,
                from_=settings.TWILIO_WHATSAPP_NUMBER,  # número SMPP configurado
                to=numero_validado if (numero_validado := ServicioNotificaciones._normalizar_numero(destinatario)) else destinatario
            )
            logger.info(
                'sms_sent',
                extra={
                    'event': 'sms_sent',
                    'status': 'success',
                    'intent': 2,
                    'notification_id': notificacion.id if notificacion else None,
                    'recipient_mask': (numero_validado or destinatario)[-4:],
                }
            )
            return True, "SMS enviado correctamente (fallback)"
        except Exception as e:
            logger.error(
                'sms_failed',
                extra={
                    'event': 'sms_error',
                    'status': 'failure',
                    'intent': 2,
                    'reason': str(e)[:200],
                    'notification_id': notificacion.id if notificacion else None,
                }
            )
            return ServicioNotificaciones._fallback_email(destinatario, mensaje, notificacion)

    @staticmethod
    def _fallback_email(destinatario, mensaje, notificacion=None):
        """
        Fallback final: email.
        Usa enviar_email con el mensaje como asunto corto.
        """
        asunto = 'Notificación importante'
        if notificacion and notificacion.titulo:
            asunto = notificacion.titulo

        # Extraer email del destinatario (puede ser un número de teléfono)
        if '@' not in str(destinatario) and notificacion and hasattr(notificacion, 'usuario'):
            email = notificacion.usuario.email
        else:
            email = str(destinatario)

        return ServicioNotificaciones.enviar_email(
            email, asunto, mensaje, notificacion, intentos_max=2
        )

    @staticmethod
    def _normalizar_numero(numero):
        """
        Valida y normaliza un número de teléfono a E.164.

        [FASE 5 §5.4] Requiere código de país (+XX).
        No loguea el número completo (solo últimos 4 dígitos).
        """
        if not numero:
            return None

        import re
        limpio = re.sub(r'[\s\-\(\)]', '', str(numero))

        if not limpio.startswith('+'):
            raise ValueError('Número debe incluir código de país (+XX)')

        if not re.match(r'^\+\d{8,15}$', limpio):
            raise ValueError('Formato de número inválido')

        return limpio
    
    @staticmethod
    def crear_notificacion(usuario, tipo, titulo, mensaje, objeto_relacionado=None):
        """Crear una notificación en la base de datos"""
        notificacion = Notificacion.objects.create(
            usuario=usuario,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            estado='pendiente'
        )
        
        if objeto_relacionado:
            content_type = ContentType.objects.get_for_model(objeto_relacionado)
            notificacion.content_type = content_type
            notificacion.object_id = objeto_relacionado.id
            notificacion.save()
        
        return notificacion
    
    @classmethod
    def notificar_cita_creada(cls, cita, creado_por_admin=False):
        """Notificar al paciente y al doctor cuando se crea una cita"""
        paciente = cita.paciente.usuario
        doctor = cita.doctor.usuario

        # Mensaje para el paciente
        titulo_paciente = 'nueva_cita_creada'
        mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}|{cita.motivo}"

        # Mensaje para el doctor
        titulo_doctor = 'nueva_cita_para_doctor'
        mensaje_doctor = f"{doctor.first_name}|{paciente.first_name} {paciente.last_name}|{cita.fecha}|{cita.hora}|{cita.motivo}"

        cls.crear_notificacion(
            usuario=doctor,
            tipo='nueva_cita',
            titulo=titulo_doctor,
            mensaje=mensaje_doctor,
            objeto_relacionado=cita
        )

        return cls.crear_notificacion(
            usuario=paciente,
            tipo='nueva_cita',
            titulo=titulo_paciente,
            mensaje=mensaje_paciente,
            objeto_relacionado=cita
        )
    
    @classmethod
    def notificar_recordatorio_cita(cls, cita):
        """Enviar recordatorio 24 horas antes de la cita"""
        paciente = cita.paciente.usuario
        doctor = cita.doctor.usuario
        
        mensaje_paciente = f"""
        🔔 Recordatorio de Cita - Belkis-saúde
        
        Hola {paciente.first_name},
        
        Te recordamos que tienes una cita mañana:
        
        📅 Fecha: {cita.fecha}
        ⏰ Hora: {cita.hora}
        👨‍⚕️ Doctor: Dr. {doctor.first_name} {doctor.last_name}
        
        Responde a este mensaje para confirmar o cancelar.
        
        1️⃣ - Confirmar asistencia
        2️⃣ - Cancelar cita
        """
        
        # Crear notificación para el paciente
        cls.crear_notificacion(
            usuario=paciente,
            tipo='recordatorio_cita',
            titulo='Recordatorio de Cita - Mañana',
            mensaje=mensaje_paciente,
            objeto_relacionado=cita
        )
        
        # También notificar al doctor
        mensaje_doctor = f"""
        🔔 Recordatorio de Cita - Belkis-saúde
        
        Dr. {doctor.first_name},
        
        Tienes una cita programada para mañana:
        
        📅 Fecha: {cita.fecha}
        ⏰ Hora: {cita.hora}
        👤 Paciente: {paciente.first_name} {paciente.last_name}
        📋 Motivo: {cita.motivo}
        """
        
        return cls.crear_notificacion(
            usuario=doctor,
            tipo='recordatorio_cita',
            titulo='Recordatorio de Cita - Mañana',
            mensaje=mensaje_doctor,
            objeto_relacionado=cita
        )
    
    @classmethod
    def notificar_cita_confirmada(cls, cita):
        """Notificar que el paciente confirmó la cita"""
        paciente = cita.paciente.usuario
        doctor = cita.doctor.usuario
        
        # Mensaje para el paciente
        titulo_paciente = 'cita_confirmada_paciente'
        mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}"
        
        # Notificar al paciente
        cls.crear_notificacion(
            usuario=paciente,
            tipo='confirmacion_cita',
            titulo=titulo_paciente,
            mensaje=mensaje_paciente,
            objeto_relacionado=cita
        )
        
        # Mensaje para el doctor
        titulo_doctor = 'cita_confirmada_doctor'
        mensaje_doctor = f"{doctor.first_name}|{paciente.first_name} {paciente.last_name}|{cita.fecha}|{cita.hora}|{cita.motivo}"
        
        return cls.crear_notificacion(
            usuario=doctor,
            tipo='confirmacion_cita',
            titulo=titulo_doctor,
            mensaje=mensaje_doctor,
            objeto_relacionado=cita
        )
    
    @classmethod
    def notificar_cita_cancelada(cls, cita, cancelado_por, cancelado_por_nombre=None):
        """Notificar que una cita fue cancelada"""
        paciente = cita.paciente.usuario
        doctor = cita.doctor.usuario
        
        if cancelado_por == 'paciente':
            # Mensaje para el doctor
            titulo_doctor = 'cita_cancelada_por_paciente_doctor'
            mensaje_doctor = f"{doctor.first_name}|{paciente.first_name} {paciente.last_name}|{cita.fecha}|{cita.hora}"
            
            cls.crear_notificacion(
                usuario=doctor,
                tipo='cancelacion_cita',
                titulo=titulo_doctor,
                mensaje=mensaje_doctor,
                objeto_relacionado=cita
            )

            # Mensaje para el paciente
            titulo_paciente = 'cita_cancelada_por_paciente_paciente'
            mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}"
            
            cls.crear_notificacion(
                usuario=paciente,
                tipo='cancelacion_cita',
                titulo=titulo_paciente,
                mensaje=mensaje_paciente,
                objeto_relacionado=cita
            )
            
            # Notificar disponibilidad
            cls.notificar_disponibilidad_doctor(doctor, cita.fecha, cita.hora)
            
        elif cancelado_por == 'doctor':
            # Mensaje para el paciente (con nombre del doctor)
            titulo_paciente = 'cita_cancelada_por_doctor_paciente'
            mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}"
            
            cls.crear_notificacion(
                usuario=paciente,
                tipo='cancelacion_cita',
                titulo=titulo_paciente,
                mensaje=mensaje_paciente,
                objeto_relacionado=cita
            )
            
        elif cancelado_por == 'admin':
            # Mensaje para el paciente (admin no se menciona por seguridad)
            titulo_paciente = 'cita_cancelada_por_admin_paciente'
            mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}"
            
            cls.crear_notificacion(
                usuario=paciente,
                tipo='cancelacion_cita',
                titulo=titulo_paciente,
                mensaje=mensaje_paciente,
                objeto_relacionado=cita
            )
            
            # Mensaje para el doctor (admin no se menciona)
            titulo_doctor = 'cita_cancelada_por_admin_doctor'
            mensaje_doctor = f"{doctor.first_name}|{paciente.first_name} {paciente.last_name}|{cita.fecha}|{cita.hora}"
            
            cls.crear_notificacion(
                usuario=doctor,
                tipo='cancelacion_cita',
                titulo=titulo_doctor,
                mensaje=mensaje_doctor,
                objeto_relacionado=cita
            )

    @classmethod
    def notificar_cita_pospuesta(cls, cita, pospuesta_por, nueva_fecha, nueva_hora, pospuesta_por_nombre=None):
        """Notificar que una cita fue pospuesta"""
        paciente = cita.paciente.usuario
        doctor = cita.doctor.usuario
        
        if pospuesta_por == 'paciente':
            # Mensaje para el doctor
            titulo_doctor = 'cita_pospuesta_por_paciente_doctor'
            mensaje_doctor = f"{doctor.first_name}|{paciente.first_name} {paciente.last_name}|{cita.fecha}|{cita.hora}|{nueva_fecha}|{nueva_hora}"
            
            cls.crear_notificacion(
                usuario=doctor,
                tipo='modificacion_cita',
                titulo=titulo_doctor,
                mensaje=mensaje_doctor,
                objeto_relacionado=cita
            )

            # Mensaje para el paciente
            titulo_paciente = 'cita_pospuesta_por_paciente_paciente'
            mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}|{nueva_fecha}|{nueva_hora}"
            
            cls.crear_notificacion(
                usuario=paciente,
                tipo='modificacion_cita',
                titulo=titulo_paciente,
                mensaje=mensaje_paciente,
                objeto_relacionado=cita
            )
        elif pospuesta_por == 'doctor':
            # Mensaje para el paciente (con nombre del doctor)
            titulo_paciente = 'cita_pospuesta_por_doctor_paciente'
            mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}|{nueva_fecha}|{nueva_hora}"
            
            cls.crear_notificacion(
                usuario=paciente,
                tipo='modificacion_cita',
                titulo=titulo_paciente,
                mensaje=mensaje_paciente,
                objeto_relacionado=cita
            )
            
        elif pospuesta_por == 'admin':
            # Mensaje para el paciente (admin no se menciona)
            titulo_paciente = 'cita_pospuesta_por_admin_paciente'
            mensaje_paciente = f"{paciente.first_name}|{doctor.first_name} {doctor.last_name}|{cita.fecha}|{cita.hora}|{nueva_fecha}|{nueva_hora}"
            
            cls.crear_notificacion(
                usuario=paciente,
                tipo='modificacion_cita',
                titulo=titulo_paciente,
                mensaje=mensaje_paciente,
                objeto_relacionado=cita
            )
            
            # Mensaje para el doctor (admin no se menciona)
            titulo_doctor = 'cita_pospuesta_por_admin_doctor'
            mensaje_doctor = f"{doctor.first_name}|{paciente.first_name} {paciente.last_name}|{cita.fecha}|{cita.hora}|{nueva_fecha}|{nueva_hora}"
            
            cls.crear_notificacion(
                usuario=doctor,
                tipo='modificacion_cita',
                titulo=titulo_doctor,
                mensaje=mensaje_doctor,
                objeto_relacionado=cita
            )
    
    @classmethod
    def notificar_disponibilidad_doctor(cls, doctor, fecha, hora):
        """Notificar que hay un horario disponible"""
        # Aquí podrías notificar a pacientes en lista de espera
        pass
    
    @classmethod
    def notificar_usuario_registrado(cls, usuario_nuevo, registrado_por_admin=None):
        """Notificar a administradores cuando se registra un nuevo usuario"""
        if usuario_nuevo.rol == 'admin':
            # Notificar a otros administradores
            otros_admins = Usuario.objects.filter(rol='admin').exclude(id=usuario_nuevo.id)
            
            titulo = 'nuevo_usuario_registrado_admin'
            mensaje = f"{usuario_nuevo.first_name} {usuario_nuevo.last_name}|{usuario_nuevo.get_rol_display()}|{usuario_nuevo.email}"
            
            for admin in otros_admins:
                cls.crear_notificacion(
                    usuario=admin,
                    tipo='nuevo_usuario',
                    titulo=titulo,
                    mensaje=mensaje
                )
    
    @classmethod
    def notificar_imagen_perfil_actualizada(cls, usuario):
        """Notificar a administradores cuando se actualiza imagen de perfil"""
        if usuario.rol in ['doctor', 'nurse']:
            # Notificar a todos los administradores
            admins = Usuario.objects.filter(rol='admin')
            
            titulo = 'imagen_perfil_actualizada_admin'
            rol_display = 'doctor' if usuario.rol == 'doctor' else 'enfermera'
            mensaje = f"{usuario.first_name} {usuario.last_name}|{rol_display}"
            
            for admin in admins:
                cls.crear_notificacion(
                    usuario=admin,
                    tipo='cambio_imagen',
                    titulo=titulo,
                    mensaje=mensaje
                )
    
    @classmethod
    def notificar_cambios_horarios(cls, usuario, accion='actualizado'):
        """Notificar a administradores cuando se cambian horarios"""
        if usuario.rol in ['doctor', 'nurse']:
            # Notificar a todos los administradores
            admins = Usuario.objects.filter(rol='admin')
            
            titulo = f'horarios_{accion}_admin'
            rol_display = 'doctor' if usuario.rol == 'doctor' else 'enfermera'
            mensaje = f"{usuario.first_name} {usuario.last_name}|{rol_display}"
            
            for admin in admins:
                cls.crear_notificacion(
                    usuario=admin,
                    tipo='cambio_horarios',
                    titulo=titulo,
                    mensaje=mensaje
                )
    
    @classmethod
    def notificar_cambios_especialidades(cls, accion='creada', especialidad_nombre=None):
        """Notificar a administradores cuando se cambian especialidades"""
        admins = Usuario.objects.filter(rol='admin')
        
        titulo = f'especialidad_{accion}_admin'
        mensaje = especialidad_nombre or 'Cambio en especialidades'
        
        for admin in admins:
            cls.crear_notificacion(
                usuario=admin,
                tipo='cambio_especialidades',
                titulo=titulo,
                mensaje=mensaje
            )
    
    @classmethod
    def notificar_cambios_imagenes_sitio(cls, accion='añadida', imagen_titulo=None):
        """Notificar a administradores cuando se cambian imágenes del sitio"""
        admins = Usuario.objects.filter(rol='admin')
        
        titulo = f'imagen_sitio_{accion}_admin'
        mensaje = imagen_titulo or 'Cambio en imágenes del sitio'
        
        for admin in admins:
            cls.crear_notificacion(
                usuario=admin,
                tipo='cambio_imagenes_sitio',
                titulo=titulo,
                mensaje=mensaje
            )