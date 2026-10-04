"""
Data migration: normalize emails before adding unique constraint.

- Normaliza email='' a None (evita colisiones con el constraint único).
- Resuelve duplicados automáticamente: mantiene el primer registro (por id)
  y pone email=None en los duplicados, preservando la cuenta de usuario
  (login sigue funcionando por username).
- Luego aplica unique=True a la columna email.
"""

from django.db import migrations, models


def normalize_and_validate_emails(apps, schema_editor):
    Usuario = apps.get_model('usuarios', 'Usuario')
    from django.db.models import Count, Min

    vacios = Usuario.objects.filter(email='')
    count_vacios = vacios.count()
    if count_vacios:
        vacios.update(email=None)
        print(f"Normalizados {count_vacios} email(s) vacío(s) a NULL.")

    duplicados = (
        Usuario.objects
        .exclude(email__isnull=True)
        .values('email')
        .annotate(c=Count('id'))
        .filter(c__gt=1)
    )
    if duplicados:
        dup_emails = [d['email'] for d in duplicados]
        print(f"RESOLVIENDO duplicados de email: {dup_emails}")
        for email in dup_emails:
            ids_ordenados = list(
                Usuario.objects
                .filter(email=email)
                .order_by('id')
                .values_list('id', flat=True)
            )
            ids_a_null = ids_ordenados[1:]
            Usuario.objects.filter(id__in=ids_a_null).update(email=None)
            print(f"  email={email}: mantenido id={ids_ordenados[0]}, "
                  f"email=None para ids={ids_a_null}")
        nuevos_dup = (
            Usuario.objects
            .exclude(email__isnull=True)
            .values('email')
            .annotate(c=Count('id'))
            .filter(c__gt=1)
        )
        if nuevos_dup:
            raise RuntimeError(
                f"Aun hay duplicados después de resolver: {[d['email'] for d in nuevos_dup]}"
            )

    print("No se encontraron correos duplicados. OK para aplicar unique constraint.")


def reverse_normalize(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0003_enfermera_biografia_alter_sitioimagen_imagen_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='usuario',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, verbose_name='Correo electrónico'),
        ),
        migrations.RunPython(normalize_and_validate_emails, reverse_code=reverse_normalize),
        migrations.AlterField(
            model_name='usuario',
            name='email',
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True, verbose_name='Correo electrónico'),
        ),
    ]
