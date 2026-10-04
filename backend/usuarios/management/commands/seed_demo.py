"""
Management command: seed_demo

Crea los usuarios de bootstrap (admin genérico + paciente demo) de forma manual.

Solo se ejecuta en modo DEBUG. En producción (DEBUG=False) aborta inmediatamente
con un error explícito.

Las credenciales DEBEN provenir de variables de entorno. No hay valores por defecto
hardcodeados para las contraseñas.
"""

import os
import logging
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction

logger = logging.getLogger(__name__)

User = get_user_model()


def ensure_generic_admin():
    """Garantiza un superusuario genérico cuando no hay otro, usando env vars.

    Si los siguientes usuarios/admins ya existen, no crea uno nuevo.
    """
    generic_username = os.environ.get('GENERIC_ADMIN_USERNAME', 'admin')
    generic_password = os.environ.get('GENERIC_ADMIN_PASSWORD')

    if not generic_password:
        raise CommandError(
            "GENERIC_ADMIN_PASSWORD no está configurada. "
            "Setéala en el entorno antes de ejecutar seed_demo."
        )

    otros = User.objects.filter(is_superuser=True).exclude(username=generic_username)
    if otros.exists():
        User.objects.filter(username=generic_username).delete()
        logger.info("Eliminado admin genérico '%s' (existe otro superuser).", generic_username)
    else:
        admin, created = User.objects.get_or_create(
            username=generic_username,
            defaults={
                'email': '',
                'is_superuser': True,
                'is_staff': True,
            }
        )
        if created:
            admin.set_password(generic_password)
            admin.save()
            logger.info("Admin genérico '%s' creado.", generic_username)
        else:
            logger.info("Admin genérico '%s' ya existe.", generic_username)


def ensure_demo_patient():
    """Crea un paciente demo para probar el chat de IA.

    Requiere DEMO_PATIENT_USERNAME y DEMO_PATIENT_PASSWORD en el entorno.
    """
    demo_username = os.environ.get('DEMO_PATIENT_USERNAME')
    demo_password = os.environ.get('DEMO_PATIENT_PASSWORD')

    if not demo_username or not demo_password:
        logger.warning(
            "Demo patient credentials not fully configured. "
            "Set DEMO_PATIENT_USERNAME and DEMO_PATIENT_PASSWORD to create one."
        )
        return None

    from usuarios.models import Paciente, Especialidad

    demo_user, created = User.objects.get_or_create(
        username=demo_username,
        defaults={
            'first_name': 'Demo',
            'last_name': 'Patient',
            'email': 'demo@belkis-saude.local',
            'rol': 'patient',
        }
    )
    if created:
        demo_user.set_password(demo_password)
        demo_user.save()
        logger.info("Usuario demo '%s' creado.", demo_username)

    paciente, created = Paciente.objects.get_or_create(
        usuario=demo_user,
        defaults={
            'alergias': 'Ninguna conocida',
            'grupo_sanguineo': 'O+',
            'contacto_emergencia': 'Contacto Demo',
            'telefono_emergencia': '555-DEMO',
        }
    )
    if created:
        logger.info("Paciente demo asociado a '%s' creado.", demo_username)

    return paciente


class Command(BaseCommand):
    help = "Crea usuarios de bootstrap (admin genérico + paciente demo). Solo se ejecuta en DEBUG."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "seed_demo solo está permitido en modo DEBUG (DEBUG=True). "
                "Para crear usuarios en producción, usa el panel de administración "
                "o un comando de gestión dedicado con autenticación explícita."
            )

        with transaction.atomic():
            ensure_generic_admin()
            ensure_demo_patient()

        self.stdout.write(
            self.style.SUCCESS("Bootstrap completado: admin genérico y paciente demo verificados.")
        )
