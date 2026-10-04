"""
Data migration: normalize emails before adding unique constraint.

- Normaliza email='' a None (evita colisiones con el constraint único).
- Detecta correos duplicados antes de aplicar unique=True. Si hay duplicados,
  la migración ABORTA con un mensaje claro para que el humano resuelva manualmente.
- No modifica datos existentes en prod; solo normaliza y valida.

Ejecutar en prod (después de validar): python manage.py migrate usuarios 0004
"""

from django.db import migrations, models


def normalize_and_validate_emails(apps, schema_editor):
    Usuario = apps.get_model('usuarios', 'Usuario')
    from django.db.models import Count

    # 1. Normalizar: email='' → None
    vacios = Usuario.objects.filter(email='')
    count_vacios = vacios.count()
    if count_vacios:
        vacios.update(email=None)
        print(f"Normalizados {count_vacios} email(s) vacío(s) a NULL.")

    # 2. Detectar duplicados (excluyendo NULL)
    duplicados = (
        Usuario.objects
        .exclude(email__isnull=True)
        .values('email')
        .annotate(c=Count('id'))
        .filter(c__gt=1)
    )
    if duplicados:
        dup_emails = [d['email'] for d in duplicados]
        dup_users = Usuario.objects.filter(email__in=dup_emails).values_list('id', 'username', 'email')
        raise RuntimeError(
            f"Duplicados de email encontrados: {dup_emails}. "
            f"Usuarios afectados: {list(dup_users)}. "
            "Resuelve manualmente antes de aplicar unique constraint."
        )
    print("No se encontraron correos duplicados. OK para aplicar unique constraint.")


def reverse_normalize(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0003_enfermera_biografia_alter_sitioimagen_imagen_and_more'),
    ]

    operations = [
        migrations.RunPython(normalize_and_validate_emails, reverse_code=reverse_normalize),
        migrations.AlterField(
            model_name='usuario',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True, verbose_name='Correo electrónico'),
        ),
    ]
