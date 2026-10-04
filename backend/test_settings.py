"""
Django test settings wrapper.
Fija env vars requeridas POR EL FAIL-FAST en core.settings antes de importarlo.
Esto permite run tests con `pytest` sin vars manuales.
"""
import os

os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("SECRET_KEY", "django-insecure-dev-only-key-not-for-production")
os.environ.setdefault("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

from core.settings import *  # noqa: F401, E402, F403

# Overrides explícitos para tests
DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "testserver"]
SECURE_PROXY_SSL_HEADER = None
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
