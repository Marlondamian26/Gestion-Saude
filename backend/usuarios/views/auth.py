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
