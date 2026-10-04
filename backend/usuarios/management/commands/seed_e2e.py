"""
Management command: seed_e2e

Crea datos mínimos para tests E2E (Playwright).
SOLO para CI. Aborta si DEBUG=False (no se ejecuta en prod).

Uso:
    python manage.py seed_e2e
    python manage.py seed_e2e --password=custompass123
"""
import os

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.conf import settings

from usuarios.models import Usuario, Doctor, Enfermera, Paciente, Especialidad, Horario
from datetime import time as dtime


class Command(BaseCommand):
    help = '[FASE 6 §6.1.5] Seed datos para tests E2E (Playwright)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password', default='E2ETest123!',
            help='Password para usuarios E2E'
        )

    def handle(self, *args, **options):
        # Solo ejecutar en dev/CI (never in production)
        if not settings.DEBUG:
            raise CommandError('seed_e2e solo puede ejecutarse con DEBUG=True (CI/dev)')

        password = options['password']
        User = get_user_model()

        # Especialidad
        especialidad, _ = Especialidad.objects.get_or_create(
            nombre='Medicina General', tipo_especialidad='medica'
        )

        # Doctor E2E
        doctor_user, _ = Usuario.objects.get_or_create(
            username='e2e_doctor',
            defaults={
                'email': 'e2e_doctor@test.local',
                'first_name': 'E2E',
                'last_name': 'Doctor',
                'rol': 'doctor',
            }
        )
        doctor_user.set_password(password)
        doctor_user.save()

        doctor, _ = Doctor.objects.get_or_create(
            usuario=doctor_user, especialidad=especialidad
        )

        # Horario para el doctor (lunes 9-10am)
        from datetime import timedelta
        Horario.objects.get_or_create(
            doctor=doctor,
            dia_semana=0,  # Lunes
            defaults={
                'hora_inicio': dtime(9, 0),
                'hora_fin': dtime(10, 0),
            }
        )

        # Enfermera E2E
        nurse_user, _ = Usuario.objects.get_or_create(
            username='e2e_nurse',
            defaults={
                'email': 'e2e_nurse@test.local',
                'first_name': 'E2E',
                'last_name': 'Nurse',
                'rol': 'nurse',
            }
        )
        nurse_user.set_password(password)
        nurse_user.save()

        # Paciente E2E
        paciente_user, _ = Usuario.objects.get_or_create(
            username='e2e_patient',
            defaults={
                'email': 'e2e_patient@test.local',
                'first_name': 'E2E',
                'last_name': 'Patient',
                'rol': 'patient',
            }
        )
        paciente_user.set_password(password)
        paciente_user.save()

        Paciente.objects.get_or_create(
            usuario=paciente_user,
            defaults={'fecha_nacimiento': '1990-01-01'}
        )

        self.stdout.write(self.style.SUCCESS(
            f'Usuarios E2E creados: e2e_doctor, e2e_nurse, e2e_patient\n'
            f'Password: {password}\n'
            f'Especialidad: Medicina General (lunes 9-10am)'
        ))
