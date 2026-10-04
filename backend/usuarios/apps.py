import os
import logging

from django.apps import AppConfig
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

GENERIC_ADMIN_USERNAME = os.environ.get('GENERIC_ADMIN_USERNAME', 'admin')


def on_user_saved(sender, instance, created, **kwargs):
    """Al guardar un usuario, eliminar el admin genérico si se crea otro superuser.

    Ya no se crea automáticamente el admin genérico aquí; eso pasa sólo a través
    del comando de gestión `seed_demo`.
    """
    if instance.is_superuser and instance.username != GENERIC_ADMIN_USERNAME:
        User = get_user_model()
        User.objects.filter(username=GENERIC_ADMIN_USERNAME).exclude(pk=instance.pk).delete()


class UsuariosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'usuarios'

    def ready(self):
        # Señales para mantener coherencia del admin genérico
        User = get_user_model()
        post_save.connect(on_user_saved, sender=User)
        # on_user_deleted se elimina: ya no se crea admin automáticamente al borrar usuarios
