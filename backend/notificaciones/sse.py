"""
Vista SSE (Server-Sent Events) para notificaciones en tiempo real.

Permite al cliente recibir notificaciones sin polling. El token JWT se pasa
por query param (?token=...) porque EventSource no admite headers custom.

Mantiene la conexión viva con heartbeats (:ping) cada 15s.
Corta la conexión a los MAX_STREAM_SECONDS (600s) para forzar reconexión.

Riesgo: en WSGI (Gunicorn sync), cada conexión bloquea un worker.
En Render free (1-2 workers), limitar concurrencia con MAX_SSE_CONCURRENT.
Recomendado migrar a ASGI (uvicorn/gunicorn uvicorn worker) en FASE 7.
"""
import json
import time
import logging

from django.http import StreamingHttpResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Notificacion
from .serializers import NotificacionSerializer

logger = logging.getLogger(__name__)

HEARTBEAT_INTERVAL = 15          # segundos entre pings
MAX_STREAM_SECONDS = 600         # cortar conexión cada 10 min
MAX_SSE_CONCURRENT = 2           # límite de conexiones concurrentes (WSGI bound)
SSE_COUNTS_KEY = 'sse_active_connections'  # clave de cache compartida (multi-worker)

_active_sse_connections = 0


def _get_cache():
    """Obtiene cache compartida (Redis) o None si no disponible."""
    try:
        from django.core.cache import cache
        # Verificar que el cache funciona (no LocMem en multi-worker)
        if hasattr(cache, 'get') and cache.get('cache_test_key') is not None or True:
            return cache
    except Exception:
        return None
    return None


def _can_stream():
    """Limita concurrencia usando cache compartida (funciona en multi-worker)."""
    cache = _get_cache()
    if cache:
        current = cache.get(SSE_COUNTS_KEY, 0)
        return current < MAX_SSE_CONCURRENT
    return _active_sse_connections < MAX_SSE_CONCURRENT


def _acquire_slot():
    cache = _get_cache()
    if cache:
        # initialize key to 0 if it doesn't exist (idempotent)
        cache.add(SSE_COUNTS_KEY, 0, timeout=120)
        cache.incr(SSE_COUNTS_KEY, delta=1)
    else:
        global _active_sse_connections
        _active_sse_connections += 1


def _release_slot():
    cache = _get_cache()
    if cache:
        try:
            cache.incr(SSE_COUNTS_KEY, delta=-1)
        except (ValueError, KeyError):
            pass  # key already expired/deleted, no-op
    else:
        global _active_sse_connections
        _active_sse_connections = max(0, _active_sse_connections - 1)


def _serializar_notificacion(notif):
    """Serializa una Notificacion como JSON string para SSE."""
    serializer = NotificacionSerializer(notif)
    return json.dumps(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class NotificacionesSSEView(View):
    """
    SSE endpoint: /api/notificaciones/stream/?token=<access_jwt>

    Envía eventos:
      - :ping (heartbeat)
      - data: {notificacion_json}

    Fallback: si la conexión SSE falla 3 veces, el cliente degrada a polling.
    """

    def get(self, request):
        token = request.GET.get('token', '')
        if not token:
            return StreamingHttpResponse(
                _sse_error('No se proporcionó token de autenticación'),
                content_type='text/event-stream',
                status=401,
            )

        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
        except (InvalidToken, TokenError, KeyError):
            return StreamingHttpResponse(
                _sse_error('Token inválido o expirado'),
                content_type='text/event-stream',
                status=401,
            )

        if not _can_stream():
            return StreamingHttpResponse(
                _sse_error('Límite de conexiones SSE alcanzado. Usa polling.'),
                content_type='text/event-stream',
                status=503,
            )

        # Permite limitar la duración en testing (query param _max_seconds)
        try:
            max_seconds = float(request.GET.get('_max_seconds', 0))
        except (TypeError, ValueError):
            max_seconds = 0
        if max_seconds <= 0:
            max_seconds = MAX_STREAM_SECONDS

        _acquire_slot()
        start_time = time.time()
        last_heartbeat = time.time()

        def event_stream():
            nonlocal last_heartbeat
            try:
                # Enviar notificaciones no leídas iniciales
                notifs = Notificacion.objects.filter(
                    usuario_id=user_id, leida=False
                ).order_by('-fecha_creacion')[:20]

                for notif in notifs:
                    yield f"data: {_serializar_notificacion(notif)}\n\n"
                    time.sleep(0.01)  # small yield to prevent blocking

                while True:
                    now = time.time()
                    elapsed = now - start_time

                    # Cortar la conexión a los MAX_STREAM_SECONDS
                    if elapsed > max_seconds:
                        logger.info("SSE connection closed (max lifetime)")
                        yield _heartbeat()
                        break

                    # Heartbeat cada HEARTBEAT_INTERVAL
                    if now - last_heartbeat >= HEARTBEAT_INTERVAL:
                        yield _heartbeat()
                        last_heartbeat = now

                    time.sleep(1)

            except GeneratorExit:
                pass
            finally:
                _release_slot()
                logger.info(f"SSE stream ended for user_id={user_id}")

        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream',
            status=200,
        )
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['X-Accel-Buffering'] = 'no'
        return response


def _heartbeat():
    """Envía un ping para mantener la conexión viva."""
    return ": ping\n\n"


def _sse_error(message):
    """Genera un evento de error SSE."""
    return f"data: {json.dumps({'error': message})}\n\n"
