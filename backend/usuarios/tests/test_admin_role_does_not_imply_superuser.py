"""
Test for §1.4: verify that rol='admin' does NOT automatically grant
is_superuser or is_staff flags. The save() method no longer forces these.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from usuarios.models import Usuario

User = get_user_model()


class TestAdminRoleDoesNotImplySuperuser(TestCase):

    def test_admin_rol_does_not_set_is_superuser(self):
        user = Usuario.objects.create_user(
            username='testadmin',
            password='Test1234!',
            rol='admin',
        )
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)

    def test_admin_rol_does_not_set_is_staff(self):
        user = Usuario.objects.create_user(
            username='testadmin2',
            password='Test1234!',
            rol='admin',
        )
        self.assertFalse(user.is_staff)

    def test_patient_rol_does_not_set_superuser(self):
        user = Usuario.objects.create_user(
            username='testpatient',
            password='Test1234!',
            rol='patient',
        )
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_staff)

    def test_explicit_superuser_preserved_after_save(self):
        """A user explicitly set as superuser should keep flags after save()."""
        user = Usuario.objects.create_user(
            username='explicitadmin',
            password='Test1234!',
            rol='admin',
        )
        user.is_superuser = True
        user.is_staff = True
        user.save()
        user.refresh_from_db()
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_staff)
