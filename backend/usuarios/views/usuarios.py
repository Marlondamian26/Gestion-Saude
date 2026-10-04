"""
VistaSet de usuarios generales.
"""
import logging

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

from ..models import Usuario
from ..serializers import UsuarioSerializer
from notificaciones.services import ServicioNotificaciones

logger = logging.getLogger(__name__)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def perform_create(self, serializer):
        """Al crear un usuario, notificar a administradores si es relevante."""
        usuario = serializer.save()

        # Notificar a otros admins si se crea un usuario nuevo
        try:
            if usuario.rol == 'admin':
                ServicioNotificaciones.notificar_usuario_registrado(usuario)
        except Exception as e:
            logger.exception('Error enviando notificación de usuario registrado: %s', e)

        return usuario
