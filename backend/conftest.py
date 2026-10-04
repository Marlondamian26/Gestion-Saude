"""
Conftest para pytest-django.

Las vars de entorno son requeridas por el fail-fast en settings.py
(SECRET_KEY en producción, REDIS_URL para CACHES, DEBUG control).
"""
import os

os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("SECRET_KEY", "test-key-not-for-production")
os.environ.setdefault("ALLOWED_HOSTS", "localhost,127.0.0.1")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
