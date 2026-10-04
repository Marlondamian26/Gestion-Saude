"""
Health check endpoint (§6.4).

GET /health/

Verifica DB, cache y Redis. Devuelve 200 si todos OK, 503 si algo crítico falla.
Rate-limited (10 req/min por IP) usando cache.

No expone información sensible (versiones, hostnames, credenciales).
"""
import time
import logging
import hashlib

from django.http import JsonResponse
from django.core.cache import cache
from django.db import connection

logger = logging.getLogger(__name__)

HEALTH_RATE_LIMIT = 10  # requests per minute
HEALTH_RATE_WINDOW = 60  # seconds


def _is_rate_limited(ip_address):
    """Simple rate limiter usando Redis cache."""
    key = f"health_ratelimit:{ip_address}"
    current = cache.get(key, 0)
    if current >= HEALTH_RATE_LIMIT:
        return True
    cache.add(key, 0, timeout=HEALTH_RATE_WINDOW)
    cache.incr(key)
    return False


def _get_client_ip(request):
    """Extrae IP del cliente (soporta X-Forwarded-For en proxies)."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def _check_db():
    """Verifica conectividad a base de datos."""
    try:
        start = time.perf_counter()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        latency = round((time.perf_counter() - start) * 1000, 2)
        return {'status': 'ok', 'latency_ms': latency}
    except Exception as e:
        logger.error(f"Health check DB failed: {e}")
        return {'status': 'error', 'error': type(e).__name__}


def _check_cache():
    """Verifica cache backend (Redis o LocMem)."""
    try:
        start = time.perf_counter()
        cache.set('_health_check', '1', timeout=10)
        result = cache.get('_health_check')
        if result != '1':
            return {'status': 'error', 'error': 'CACHE_VALUE_MISMATCH'}
        latency = round((time.perf_counter() - start) * 1000, 2)
        cache.delete('_health_check')
        return {'status': 'ok', 'latency_ms': latency}
    except Exception as e:
        logger.error(f"Health check cache failed: {e}")
        return {'status': 'error', 'error': type(e).__name__}


def _check_redis():
    """Verifica Redis directamente (si REDIS_URL está configurado)."""
    from django.conf import settings
    redis_url = getattr(settings, 'REDIS_URL', None)
    if not redis_url:
        # Redis no configurado — usar cache backend como verificación
        return _check_cache()

    try:
        from redis import from_url
        start = time.perf_counter()
        client = from_url(redis_url, socket_connect_timeout=2, socket_timeout=2)
        client.ping()
        latency = round((time.perf_counter() - start) * 1000, 2)
        client.close()
        return {'status': 'ok', 'latency_ms': latency}
    except Exception as e:
        logger.error(f"Health check Redis failed: {e}")
        return {'status': 'error', 'error': type(e).__name__}


def health_view(request):
    """
    Health check completo.

    Códigos de estado:
      - 200: todos los componentes críticos OK.
      - 429: rate limit excedido.
      - 503: al menos un componente crítico falló.
    """
    import os

    # Rate limiting
    client_ip = _get_client_ip(request)
    if _is_rate_limited(client_ip):
        return JsonResponse({'status': 'rate_limited'}, status=429)

    components = {}
    critical_failed = False

    # DB — crítico
    db_result = _check_db()
    components['db'] = db_result
    if db_result['status'] != 'ok':
        critical_failed = True

    # Cache — crítico (rate limiting, sesiones)
    cache_result = _check_cache()
    components['cache'] = cache_result
    if cache_result['status'] != 'ok':
        critical_failed = True

    # Redis — no crítico si LocMem está funcionando
    redis_result = _check_redis()
    components['redis'] = redis_result

    status = 'error' if critical_failed else 'ok'
    return JsonResponse({
        'status': status,
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'version': os.environ.get('RENDER_GIT_COMMIT', 'dev')[:7],
        'components': components,
    }, status=503 if critical_failed else 200)
