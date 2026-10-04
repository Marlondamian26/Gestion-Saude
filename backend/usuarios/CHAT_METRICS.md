# ChatIA Métricas — Catálogo de eventos

## Visión general

FASE 5 §5.5 implementa **Opción A: logging estructurado** para el ChatIA.
No persiste eventos en base de datos (baja para evitar overhead de escritura en cada mensaje).

## Catálogo de eventos

| Evento | Trigger | Dimensiones |
|--------|---------|-------------|
| `chat_session_started` | Nueva instancia de `ServicioIA` creada | `user_id`, `user_role` |
| `chat_intent_detected` | Estado transiciona a una intención | `intent` (confirmar/seleccionar_especialidad/seleccionar_fecha/seleccionar_hora/seleccionar_medico/cancelar/ver_horarios), `raw_message` (sanitizado) |
| `chat_intent_unrecognized` | Estado vuelve a `INICIO` sin match | `raw_message` (sanitizado) |
| `chat_cita_creada` | Cita creada exitosamente | `cita_id` |
| `chat_abandoned` | Sesión expirada sin confirmar | `duration_seconds` |
| `chat_error` | Excepción en `procesar_chat` | `error` (truncado 200c), `context` |

## Sanitización de PII

- Emails → reemplazados con `[EMAIL]`
- Teléfonos E.164 → eliminados (solo últimos 4 dígitos logueados en WhatsApp)
- Tokens/secrets → nunca logueados
- Mensajes → truncados a 200 caracteres

## KPIs a vigilar

1. **Tasa de conversión:** `chat_cita_creada / chat_session_started` → objetivo ≥2%
2. **Intenciones no reconocidas/semana:** `< 15% de chat_intent_unrecognized`
3. **Duración promedio de sesión:** tiempo entre `chat_session_started` y `chat_cita_creada` o `chat_abandoned`

## Consultar logs en Render

Los logs están en stdout con tag `chatia.metrics`. Desde el CLI de Render:

```bash
# Filtrar eventos de ChatIA
render logs --service <service-name> --grep "chatia_event"

# Contar intenciones no reconocidas en las últimas 24h
render logs --service <service-name> --grep "chat_intent_unrecognized" | wc -l
```

## [OPCIONAL] Persistencia de métricas (FASE 7)

Si el negocio requiere dashboards internos, crear tabla `ChatMetric`:

```python
class ChatMetric(models.Model):
    user = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    event = models.CharField(max_length=50)
    metadata = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
```

**Trade-off:** +1 escritura por evento. Solo si el volumen de mensajes < 1000/hora.
