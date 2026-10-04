"""
[FASE 5 §5.3] Añadir campo 'intentos' a Notificacion para trazabilidad de envíos.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notificaciones', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificacion',
            name='intentos',
            field=models.PositiveIntegerField(default=0, verbose_name='Número de intentos de envío'),
        ),
    ]
