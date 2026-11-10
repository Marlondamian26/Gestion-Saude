"""
Vistas de autenticación y gestión de usuarios.

Incluye:
- RegistroAnonThrottle: throttle dedicado para /api/registro/
- registro_usuario: registro público de usuarios
- usuario_actual: obtener datos del usuario autenticado
- cambiar_contrasena: cambio de contraseña del usuario
- gestionar_foto_perfil: subir/eliminar foto de perfil
- CustomTokenObtainPairView: token con login por email/teléfono/username
"""
import logging

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle
from rest_framework.decorators import throttle_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import update_session_auth_hash
from django.conf import settings

from ..models import Usuario, Paciente
from ..serializers import (
    UsuarioSerializer, RegistroUsuarioSerializer, CustomTokenObtainPairSerializer,
)
from ..image_utils import validar_imagen, optimizar_imagen
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class RegistroAnonThrottle(AnonRateThrottle):
    """Throttle dedicado para el endpoint público de registro."""
    scope = 'registro'


class CustomTokenObtainPairView(TokenObtainPairView):
    """Endpoint de token que permite login via email/teléfono/username."""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegistroAnonThrottle])
def registro_usuario(request):
    """
    Vista para registro de usuarios (pública - NO requiere token).
    """
    serializer = RegistroUsuarioSerializer(data=request.data)
    if serializer.is_valid():
        usuario = serializer.save()
        if usuario.rol == 'patient':
            from django.db import IntegrityError, transaction
            try:
                with transaction.atomic():
                    Paciente.objects.create(usuario=usuario)
            except IntegrityError:
                pass

        # Notificar si se registra un admin
        try:
            if usuario.rol == 'admin':
                ServicioNotificaciones.notificar_usuario_registrado(usuario)
        except Exception as e:
            logger.exception('Error enviando notificación de usuario registrado: %s', e)

        # Devolvemos también un token para que el usuario quede logueado automáticamente
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(usuario)
        return Response({
            'user': UsuarioSerializer(usuario, context={'request': request}).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    """Obtener información del usuario actual (requiere token)."""
    serializer = UsuarioSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_contrasena(request):
    """Cambiar la contraseña del usuario autenticado."""
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not user.check_password(old_password):
        return Response({'error': 'Contraseña actual incorrecta'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 4:
        return Response({'error': 'La contraseña debe tener al menos 4 caracteres'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    # Mantener la sesión activa después de cambiar contraseña
    update_session_auth_hash(request, user)

    return Response({'message': 'Contraseña actualizada correctamente'}, status=status.HTTP_200_OK)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def gestionar_foto_perfil(request, usuario_id=None):
    """
    POST: Subir/actualizar foto de perfil.
    DELETE: Eliminar foto de perfil.

    Los usuarios pueden actualizar su propia foto.
    Los admins pueden actualizar la foto de cualquier usuario.
    """
    # Determinar el usuario a actualizar
    if usuario_id:
        from django.shortcuts import get_object_or_404
        usuario = get_object_or_404(Usuario, id=usuario_id)
        # Solo admins pueden actualizar fotos de otros usuarios; el propio usuario puede usar su propio ID.
        if request.user.rol != 'admin' and usuario != request.user:
            return Response({'error': 'No tienes permiso para actualizar fotos de otros usuarios'},
                            status=status.HTTP_403_FORBIDDEN)
    else:
        # Usuario actualizando su propia foto
        usuario = request.user

    if request.method == 'POST':
        # Validar que haya una imagen en el request
        if 'foto' not in request.FILES:
            return Response({'error': 'Se requiere enviar una imagen en el campo "foto"'}, status=status.HTTP_400_BAD_REQUEST)

        archivo_foto = request.FILES['foto']

        # [FASE 5 §5.2] Validar tipo MIME real con Pillow (no confiar en content_type)
        try:
            validar_imagen(archivo_foto)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Redimensionar y convertir a WebP (5MB max, 512x512)
        try:
            archivo_foto = optimizar_imagen(archivo_foto, target_size=(512, 512))
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Asegurar que el directorio de media existe
        import os
        try:
            os.makedirs(str(settings.MEDIA_ROOT / 'perfiles'), exist_ok=True)
        except Exception as e:
            return Response({'error': f'Error creating directory: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Eliminar foto antigua si existe
        try:
            if usuario.foto_perfil:
                usuario.foto_perfil.delete()
        except Exception as e:
            logger.warning('Error eliminando foto antigua: %s', e)

        # Guardar nueva foto
        usuario.foto_perfil = archivo_foto
        try:
            usuario.save()
        except Exception as e:
            return Response({'error': f'Error saving user: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Notificar si es doctor o enfermera
        try:
            if usuario.rol in ['doctor', 'nurse']:
                ServicioNotificaciones.notificar_imagen_perfil_actualizada(usuario)
        except Exception as e:
            logger.exception('Error enviando notificación de imagen de perfil actualizada: %s', e)

        serializer = UsuarioSerializer(usuario, context={'request': request})
        return Response({
            'message': 'Foto de perfil actualizada correctamente',
            'usuario': serializer.data
        }, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        # Eliminar foto de perfil
        try:
            if usuario.foto_perfil:
                usuario.foto_perfil.delete()
                usuario.foto_perfil = None
                usuario.save()
        except Exception as e:
            return Response({'error': f'Error eliminando foto: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = UsuarioSerializer(usuario, context={'request': request})
        return Response({
            'message': 'Foto de perfil eliminada correctamente',
            'usuario': serializer.data
        }, status=status.HTTP_200_OK)


# =============================================================================
# Vistas de recuperación de contraseña (Password Reset)
# =============================================================================

from django.utils import timezone
from django.conf import settings
from ..models import PasswordResetToken
from ..serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer


class PasswordResetRequestThrottle(AnonRateThrottle):
    """Throttle dedicado para solicitud de recuperación de contraseña."""
    scope = 'password_reset_request'


class PasswordResetConfirmThrottle(AnonRateThrottle):
    """Throttle dedicado para confirmación de recuperación de contraseña."""
    scope = 'password_reset_confirm'


def _enmascarar_email(email):
    """Devuelve el email enmascarado para logs (us***@dominio.com)."""
    if not email or '@' not in email:
        return 'desconocido'
    parte_local, dominio = email.split('@', 1)
    if len(parte_local) <= 2:
        mascarada = parte_local[0] + '***'
    else:
        mascarada = parte_local[:2] + '***'
    return f'{mascarada}@{dominio}'


def _construir_enlace_reset(token_plano):
    """Construye la URL completa del enlace de restablecimiento."""
    frontend_url = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    if not frontend_url:
        # Fallback para desarrollo local
        frontend_url = 'http://localhost:5173'
    return f'{frontend_url}/reset-password/{token_plano}'


def _enviar_email_recuperacion(usuario, token_plano):
    """Envía el email de recuperación de contraseña al usuario."""
    if not usuario.email:
        logger.warning(
            'Usuario %s sin email configurado, no se puede enviar enlace de recuperación.',
            usuario.id,
        )
        return False, 'Usuario sin email configurado.'

    enlace = _construir_enlace_reset(token_plano)
    timeout_min = int(getattr(settings, 'PASSWORD_RESET_TIMEOUT', 3600) / 60)

    asunto = 'Recupera tu contraseña — Gestion-Saude'

    mensaje_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f4f2ee; color: #1a1816;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
            <tr>
                <td align="center" style="padding-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 24px; color: #00a896; font-weight: 700;">Gestion-Saude</h1>
                </td>
            </tr>
            <tr>
                <td style="background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e6e2db;">
                    <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1a1816;">Hola {usuario.first_name or usuario.username},</h2>
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #3d3935; line-height: 1.5;">
                        Recibimos una solicitud para restablecer la contraseña de tu cuenta de Gestion-Saude.
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #3d3935; line-height: 1.5;">
                        Haz clic en el botón de abajo para crear una nueva contraseña. El enlace expira en
                        <strong>{timeout_min} minutos</strong>.
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                            <td align="center">
                                <a href="{enlace}" style="display: inline-block; background-color: #00a896; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                                    Restablecer contraseña
                                </a>
                            </td>
                        </tr>
                    </table>
                    <p style="margin: 24px 0 0 0; font-size: 13px; color: #78716c; line-height: 1.5;">
                        Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual
                        permanecerá vigente hasta que uses este enlace.
                    </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding-top: 24px; font-size: 12px; color: #a8a29e;">
                    Gestion-Saude — Plataforma de Gestión Médica
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    mensaje_texto = f"""
Hola {usuario.first_name or usuario.username},

Recibimos una solicitud para restablecer la contraseña de tu cuenta de Gestion-Saude.

Haz clic en el siguiente enlace para crear una nueva contraseña. El enlace expira en {timeout_min} minutos:

{enlace}

Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual permanecerá vigente hasta que uses este enlace.

Gestion-Saude — Plataforma de Gestión Médica
"""

    try:
        success, message = ServicioNotificaciones.enviar_email(
            destinatario=usuario.email,
            asunto=asunto,
            mensaje=mensaje_html,
        )
        if not success:
            logger.error(
                'Error enviando email de recuperación a %s: %s',
                _enmascarar_email(usuario.email), message,
            )
        return success, message
    except Exception as e:
        logger.exception(
            'Excepción enviando email de recuperación a %s: %s',
            _enmascarar_email(usuario.email), str(e)[:200],
        )
        return False, str(e)[:200]


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRequestThrottle])
def password_reset_request(request):
    """
    Endpoint público para solicitar un enlace de recuperación de contraseña.

    Siempre responde 200 con un mensaje genérico, exista o no el email
    registrado, para evitar enumeración de usuarios.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']

    try:
        usuario = Usuario.objects.get(email__iexact=email)
    except Usuario.DoesNotExist:
        # No revelar si el email existe o no
        logger.info(
            'Solicitud de reset con email no registrado: %s',
            _enmascarar_email(email),
        )
        return Response({
            'detail': 'Si el correo está registrado, recibirás un enlace de recuperación.'
        }, status=status.HTTP_200_OK)

    # No permitir reset en cuentas inactivas
    if not usuario.is_active:
        logger.info(
            'Solicitud de reset para usuario inactivo: %s',
            _enmascarar_email(email),
        )
        return Response({
            'detail': 'Si el correo está registrado, recibirás un enlace de recuperación.'
        }, status=status.HTTP_200_OK)

    try:
        token, token_plano = PasswordResetToken.create_for_user(usuario)
    except Exception as e:
        logger.exception(
            'Error generando token de reset para %s: %s',
            _enmascarar_email(email), str(e)[:200],
        )
        return Response({
            'detail': 'Si el correo está registrado, recibirás un enlace de recuperación.'
        }, status=status.HTTP_200_OK)

    success, message = _enviar_email_recuperacion(usuario, token_plano)
    if not success:
        logger.error(
            'Fallo al enviar email de recuperación a %s: %s',
            _enmascarar_email(email), message,
        )
        # Aun así respondemos 200 genérico para no filtrar información

    return Response({
        'detail': 'Si el correo está registrado, recibirás un enlace de recuperación.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetConfirmThrottle])
def password_reset_confirm(request):
    """
    Endpoint público para confirmar la nueva contraseña usando el token.

    Valida el token (existencia, expiración, un solo uso, usuario activo),
    valida la política de contraseñas de Django, actualiza la contraseña
    e invalida el token.
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token_plano = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']

    try:
        usuario = PasswordResetToken.validar_y_consumir(token_plano)
    except ValueError as exc:
        logger.warning(
            'Token de reset inválido: %s',
            str(exc)[:200],
        )
        return Response({
            'error': 'Token inválido o expirado.'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        usuario.set_password(new_password)
        usuario.save(update_fields=['password'])
    except Exception as e:
        logger.exception(
            'Error guardando nueva contraseña para usuario %s: %s',
            usuario.id, str(e)[:200],
        )
        return Response({
            'error': 'No se pudo actualizar la contraseña. Inténtalo de nuevo.'
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'detail': 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
    }, status=status.HTTP_200_OK)
