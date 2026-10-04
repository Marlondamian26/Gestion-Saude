"""
Data migration: report users with rol='admin' AND is_superuser=True.

This migration does NOT modify any data. It only prints a report of
users that may be affected by the removal of automatic is_superuser
forcing in Usuario.save(). The human must review and confirm
before running a separate migration to demote them if desired.

Related change: users/usuarios/models.py — save() no longer forces
is_superuser based on rol. The rol='admin' field now grants business
permissions only, not Django admin / superuser privileges.
"""

from django.db import migrations


def report_admin_superusers(apps, schema_editor):
    Usuario = apps.get_model('usuarios', 'Usuario')
    affected = Usuario.objects.filter(rol='admin', is_superuser=True)
    count = affected.count()
    if count:
        print(f"\n=== REPORT: {count} usuario(s) con rol='admin' AND is_superuser=True ===")
        print("Estos usuarios fueron afectados por la eliminación del forzado automático de is_superuser.")
        print("Revisa cada uno y decide si debe conservar o perder el acceso de superuser.\n")
        for u in affected:
            print(f"  - username={u.username}, email={u.email}, "
                  f"is_staff={u.is_staff}, date_joined={u.date_joined}")
        print("\n[REQUIERE ACCIÓN MANUAL] Revisa estos usuarios antes de migrar a producción.\n")
    else:
        print("=== REPORT: No se encontraron usuarios con rol='admin' AND is_superuser=True ===")


def reverse_report(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0004_normalize_email'),
    ]

    operations = [
        migrations.RunPython(report_admin_superusers, reverse_code=reverse_report),
    ]
