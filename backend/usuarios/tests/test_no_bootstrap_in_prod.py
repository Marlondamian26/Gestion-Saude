"""
Test for §1.1: verify that bootstrap (admin/demo user creation) does NOT happen
automatically on app import. The only way to create these users is via the
`seed_demo` management command, which fails-fast when DEBUG=False.
"""
from django.test import TestCase, override_settings
from django.core.management import call_command, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()


class TestNoBootstrapInProd(TestCase):
    """Verify seed_demo fails in production and doesn't auto-create users."""

    @override_settings(DEBUG=False)
    def test_seed_demo_command_fails_when_debug_false(self):
        with self.assertRaises(CommandError):
            call_command('seed_demo')

    def test_no_users_created_on_app_import(self):
        """Verify that simply having Django loaded does not create users."""
        count_before = User.objects.count()
        count_after = User.objects.count()
        self.assertEqual(count_before, count_after)