# Logging — Backend Django

Guía de logging estructurado para **Gestão Saúde** (FASE 6 §6.3).

## Configuración

### Formato de logs

- **Production (`DEBUG=False`)**: JSON estructurado (one log per line).
- **Development (`DEBUG=True`)**: formato verbose legible por humanos.

### JSON Output (Production)

Cada entrada log de producción incluye:

```json
{
  "timestamp": "2026-10-04T07:45:30.123Z",
  "level": "WARNING",
  "msg": "Email enviado con retry",
  "logger": "notificaciones.services",
  "module": "services",
  "func": "enviar_email",
  "lineno": 445,
  "extra": {
    "intento": 2,
    "destino": "paciente@test.local"
  }
}
```

Fields:
- `timestamp`: ISO 8601 UTC.
- `level`: `DEBUG | INFO | WARNING | ERROR | CRITICAL`.
- `msg`: mensaje principal.
- `logger`: nombre del logger (`app_label.module`).
- `module, func, lineno`: para tracing.
- `extra`: campos adicionales contextuales.

### Formato Dev (Development)

```
[2026-10-04 07:45:30] WARNING [notificaciones.services:services:445] enviar_email - Email enviado con retry | intento=2 destino=paciente@test.local
```

## Loggers configurados

| Logger | Nivel | Propósito |
|---|---|---|
| `django` | WARNING | Framework Django |
| `django.security` | INFO | Errores de seguridad (404, 403, invalid POST) |
| `core.services` | DEBUG | Lógica de negocio core |
| `notificaciones.services` | DEBUG | Envío de emails, WhatsApp, retry |
| `usuarios.ai_service` | INFO | ChatIA (no modificar, solo instrumentar) |
| `sentry` | ERROR | Captura para Sentry (via LoggingIntegration) |

## Políticas

### Nunca loguear:
- Passwords, tokens, claves API.
- Datos PII (emails completos en logs de error sin enmascarar).
- Secretos del entorno (`SECRET_KEY`, `DATABASE_URL`).

### Sanitización
- `beforeSend` en Sentry remueve `Authorization` y `Cookie` headers.
- Emails parcialmente enmascarados en logs: `p****@test.local`.

## Debugging

```bash
# Ver logs en vivo (dev)
python manage.py runserver 2>&1 | tee -a dev.log

# Ver logs de producción (Render)
# Desde el dashboard de Render → Logs

# Buscar errores por request ID
# Cada request tiene x-request-id (custom middleware)
grep "request_id" /path/to/logs.json
```

## Alertas (Sentry)

- `traces_sample_rate: 0.1` → 10% de transacciones para tracing.
- `profiles_sample_rate: 0.1` → 10% de profiling.
- `sendDefaultPii: false` → no se envían datos PII.
- Errores críticos (`CRITICAL`) → alerta en Slack/Discord.

## Health check

```
GET /health/
200 OK — si DB, cache y Redis responden.
503 — si algo falla.
429 — rate limit excedido (10 req/min por IP).
```

## Uso en código

```python
import logging
logger = logging.getLogger(__name__)

# Niveles:
logger.debug("Detalle para debugging")        # dev only
logger.info("Evento normal")                  # prod + dev
logger.warning("Potencial problema")          # prod + dev
logger.error("Error recuperable")             # prod + dev
logger.critical("Error crítico del sistema")  # alerta inmediata
```
