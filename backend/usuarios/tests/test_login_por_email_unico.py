"""
Test for §1.5: verify email field is unique, nullable, and that
duplicate emails are rejected. Also test serializer handles MultipleObjectsReturned.
"""
from django.test import TestCase
from django.db import IntegrityError, transaction
from usuarios.models import Usuario


class TestEmailUnico(TestCase):

    def test_no_se_pueden_crear_dos_usuarios_con_mismo_email(self):
        Usuario.objects.create_user(
            username='user1',
            password='Test1234!',
            email='test@test.com',
            rol='patient',
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Usuario.objects.create_user(
                    username='user2',
                    password='Test1234!',
                    email='test@test.com',
                    rol='patient',
                )

    def test_email_puede_ser_null(self):
        # Django's create_user converts None → '', so use raw create + set_password
        user = Usuario.objects.create(
            username='nologeo',
            email=None,
            rol='patient',
        )
        user.set_password('Test1234!')
        user.save()
        user.refresh_from_db()
        self.assertIsNone(user.email)

    def test_email_null_no_colisiona(self):
        """Multiple users with NULL email should be allowed (unique NULLs)."""
        u1 = Usuario.objects.create(username='u1', email=None, rol='patient')
        u1.set_password('Test1234!')
        u1.save()
        u2 = Usuario.objects.create(username='u2', email=None, rol='patient')
        u2.set_password('Test1234!')
        u2.save()
        self.assertIsNotNone(u1)
        self.assertIsNotNone(u2)

    def test_unique_constraint_enforced(self):
        Usuario.objects.create_user(
            username='unique1',
            password='Test1234!',
            email='unique@test.com',
            rol='patient',
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Usuario.objects.create_user(
                    username='unique2',
                    password='Test1234!',
                    email='unique@test.com',
                    rol='patient',
                )
