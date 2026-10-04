"""
Instrumentación de métricas y logging para ChatIA (§5.5).

[FASE 5 §5.5] Opción A (logs) — no persiste en BD para minimizar overhead.
Los logs se envían a stdout (capturados por Render) con formato estructurado.

Catálogo de eventos:
  - chat_session_started     — usuario abre el chat
  - chat_intent_detected     — intención reconocida (agendar/cancelar/ver_horarios)
  - chat_intent_unrecognized — texto no matchea palabras clave
  - chat_especialidad_selected — selecciona especialidad
  - chat_fecha_selected      — selecciona fecha
  - chat_medico_selected     — selecciona médico
  - chat_cita_creada         — cita creada exitosamente
  - chat_abandoned           — sesión expira sin confirmar (cleanup)
  - chat_error               — excepción durante el flujo

[REQUERIMIENTO] No loguear PII (emails, teléfonos, mensajes completos).
Los mensajes se truncan a 200 chars y se sanitizan.
"""
import time
import json
import re
import logging

logger = logging.getLogger('chatia.metrics')


# Patrones PII para sanitizar — reemplaza con ***
_PII_PATTERNS = [
    (re.compile(r'\b[\w\.-]+@[\w\.-]+\.\w{2,}\b'), '[EMAIL]'),
    (re.compile(r'\b\+?\d{8,15}\b'), '[PHONE]'),
]

_MAX_MSG_LEN = 200
_SANITIZED_KEYS = {'access', 'refresh', 'password', 'token'}


def _sanitize_message(msg):
    """Trunca y elimina PII de un mensaje."""
    if not msg:
        return ''
    text = str(msg)[:_MAX_MSG_LEN]
    for pattern, replacement in _PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def log_event(user, event, **kwargs):
    """
    Loggea un evento de ChatIA con formato estructurado.

    Args:
        user: Usuario (o None para eventos anónimos).
        event: string del evento (ver catálogo).
        **kwargs: dimesiones adicionales (intent, error, cita_id, etc.).
    """
    payload = {
        'event': event,
        'user_id': getattr(user, 'id', None),
        'user_role': getattr(user, 'rol', None),
        'timestamp': time.time(),
    }

    for key, value in kwargs.items():
        if key in _SANITIZED_KEYS:
            continue  # no loguear tokens/secrets
        if key in ('raw_message', 'mensaje', 'message'):
            value = _sanitize_message(value)
        if key in ('recipient', 'destino', 'email', 'phone'):
            value = '[REDACTED]'
        payload[key] = value

    logger.info('chatia_event', extra={'data': payload})


def log_session_started(user):
    """Usuario abre el chat."""
    log_event(user, 'chat_session_started')


def log_intent_detected(user, intent, mensaje=None):
    """Intención reconocida."""
    log_event(user, 'chat_intent_detected', intent=intent, raw_message=mensaje)


def log_intent_unrecognized(user, mensaje):
    """Texto no matchea ninguna palabra clave."""
    log_event(user, 'chat_intent_unrecognized', raw_message=mensaje)


def log_cita_creada(user, cita_id):
    """Cita creada exitosamente."""
    log_event(user, 'chat_cita_creada', cita_id=cita_id)


def log_abandoned(user, session_duration):
    """Sesión expirada sin confirmar."""
    log_event(user, 'chat_abandoned', duration_seconds=session_duration)


def log_error(user, error, context=None):
    """Error durante el flujo de ChatIA."""
    log_event(user, 'chat_error', error=str(error)[:200], context=context)
