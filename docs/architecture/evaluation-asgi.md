# Evaluación ASGI vs WSGI para SSE

**FASE 7 §7.3 — Evaluación arquitectónica**
**Fecha:** 2026-10-04
**Estado:** Evaluación completada, migración no aplicada sin aprobación explícita.

## Contexto

FASE 5 introdujo SSE (Server-Sent Events) para notificaciones en tiempo real sobre Gunicorn WSGI:

```yaml
# render.yaml (actual)
startCommand: gunicorn core.wsgi:application --workers ${RENDER_CPU_COUNT:-1} --threads 4 --timeout 120
```

### Problema

Cada conexión SSE mantiene un hilo worker ocupado hasta `MAX_STREAM_SECONDS` (600s) o hasta que el cliente se desconecte. Con Gunicorn WSGI:

- **1 worker, 4 threads**: máximo 4 conexiones SSE simultáneas antes de bloquear requests HTTP normales.
- **Multi-worker**: el contador `_active_sse_connections` es in-memory por-worker, no funciona como límite global. Se implementó fix con cache compartida (véase `sse.py:SSE_COUNTS_KEY`).
- **Render free**: `--workers` puede ser 1 (auto), por lo que el límite efectivo es ~4 conexiones.

### Proyección de carga

| Escenario | Usuarios concurrentes | SSE activos estimados | Workers disponibles | ¿WSGI suficiente? |
|---|---|---|---|---|
| Desarrollo | 1-5 | 0-1 | 1 | ✅ Sí |
| Beta (clínica pequeña) | 50-200 | 5-20 | 1-2 | ⚠️ Límite alcanzado |
| Producción (clínica mediana) | 500-2000 | 100-500 | 2-4 | ❌ No |

> **Suposición:** 10-25% de usuarios tienen notificaciones activas y usan SSE. Con polling fallback, el 80-100% degrada a polling (menos presión, pero no tiempo real).

## Alternativas evaluadas

| Opción | Pros | Contras | Coste (USD/mes) | Veredicto |
|---|---|---|---|---|
| **A) Mantener WSGI + polling** | Zero cambios. Simple. | No tiempo real. Usuarios siempre en polling (60s). | $0 | ✅ **Corto plazo (< 20 usuarios concurrentes)** |
| **B) WSGI + SSE limitado** | SSE acotado (semáforo cache-based). | Se satura rápido (4-8 conexiones). | $0 | ✅ **Media corta (< 50 usuarios)** |
| **C) ASGI (Uvicorn) + Gunicorn worker ASGI** | SSE escalable. 1 worker ASGI gestiona cientos de conexiones concurrentes (asyncio). Django Channels no requerido (Django 6 soporta ASGI nativo). | Requiere `uvicorn[standard]`. Tests de compatibilidad (pytest-asyncio, etc). `--workers >1` requiere Redis pub/sub para SSE consistente. | $0 (Compute) +$0 (Redis si existe) | ✅ **Recomendado si > 50 usuarios concurrentes** |
| **D) ASGI + Django Channels + Redis pub/sub** | SSE/WebSocket bidireccional. Broadcasting entre workers. | Complejidad alta. `channels-redis`. Migrar views a consumers. | $7+ (Redis dedicado) | ❌ **Descartado — sobreingeniería para necesidad actual** |
| **E) Servicio externo (Pusher, Ably)** | Zero infra. Escalado automático. | Vendor lock-in. Coste mensual. PII en terceros. | $29-200 | ❌ **Descartado por coste y vendor lock** |

## Veredicto

**Corto plazo (0-6 meses): Opción B** — WSGI + SSE con semáforo cache-based (ya implementado en `sse.py`). Límite de 2-4 conexiones SSE concurrentes. Resto degrada a polling (60s).

**Media plazo (6+ meses o > 50 usuarios concurrentes): Opción C** — Migrar a ASGI (Uvicorn). No requiere Django Channels (Django 6 soporta ASGI nativo). El `core/asgi.py` ya existe.

### Cómo migrar (Opción C)

1. **Añadir a `requirements.txt`:**
   ```
   uvicorn[standard]==0.32.0
   ```

2. **Cambiar `render.yaml`:**
   ```yaml
   startCommand: uvicorn core.asgi:application --host 0.0.0.0 --port $PORT --workers 1 --limit-concurrency 1000 --timeout-keep-alive 5
   ```
   Notas:
   - `--workers 1`: con 1 worker ASGI, se gestionan cientos de conexiones concurrentes via asyncio.
   - `--workers >1` requiere sticky sessions o Redis pub/sub para eventos SSE consistentes.
   - `--limit-concurrency 1000`: límite de requests concurrentes.

3. **Verificar compatibilidad:**
   - `core/asgi.py` ya configurado (Django 6). ✅
   - `django-cors-headers`: compatible con ASGI. ✅
   - `drf-spectacular`, `rest_framework`: compatibles. ✅
   - Tests: `pytest-django` funciona con ASGI. Agregar `pytest-asyncio` si se usan consumers.

4. **Plan de rollback:**
   - Revertir `startCommand` en `render.yaml` de vuelta a Gunicorn WSGI.
   - Redeseñar toma < 1 minuto en Render.

## Estado actual de mitigación (Opción B)

- ✅ `MAX_SSE_CONCURRENT = 2` (configurable en settings).
- ✅ Cache-based counter (`SSE_COUNTS_KEY`) — funciona multi-worker con Redis.
- ✅ Fallback a in-memory counter si Redis no disponible.
- ✅ TTL de 120s en clave de cache (evita zombie counts).
- ✅ Cliente frontend degrada a polling tras 3 fallos SSE (FASE 5).

## Decisiones pendientes

- [ ] **Aprobar migración a ASGI (Opción C)** — requiere validación en staging con carga simulada.
- [ ] **Aprobar upgrade de plan** (si usuarios > 20 concurrentes en pico).

## Referencias

- `backend/notificaciones/sse.py` — implementación SSE actual.
- `backend/core/asgi.py` — ASGI app listo (no en uso en prod).
- `render.yaml` — Gunicorn WSGI actual.
