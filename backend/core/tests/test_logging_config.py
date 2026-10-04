"""
Tests para configuración de logging (§6.3).
"""
import logging

from django.test import TestCase


class TestLoggingConfig(TestCase):

    def test_chatia_metrics_logger_configurado(self):
        """El logger chatia.metrics está configurado."""
        logger = logging.getLogger('chatia.metrics')
        self.assertEqual(logger.level, logging.INFO)

    def test_root_logger_configurado(self):
        """Root logger tiene handlers."""
        root_logger = logging.getLogger()
        self.assertTrue(len(root_logger.handlers) > 0)

    def test_logging_config_in_settings(self):
        """LOGGING está definido en settings."""
        from django.conf import settings
        self.assertIn('LOGGING', dir(settings) or settings.__dict__)
        logging_config = getattr(settings, 'LOGGING', {})
        self.assertIn('chatia.metrics', logging_config.get('loggers', {}))
