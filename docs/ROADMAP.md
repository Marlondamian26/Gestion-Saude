# Roadmap de Producto — Gestão Saúde

**FASE 7 §7.5 — Roadmap funcional y técnico**
**Fecha última actualización:** 2026-10-04

---

## Inventario de funcionalidad actual

### Módulos implementados

| Módulo | Estado | Descripción |
|---|---|---|
| **Usuarios** | ✅ Activo | Registro, autenticación (JWT), roles (admin/doctor/nurse/patient), perfil editable, foto de perfil (WebP 512×512). |
| **Doctores** | ✅ Activo | CRUD doctores, especialidades, horarios de atención (días/hora). |
| **Enfermeras** | ✅ Activo | Perfil con especialidad y licencia. |
| **Pacientes** | ✅ Activo | Perfil con alergias, grupo sanguíneo, contacto de emergencia. Búsqueda por nombre/username. |
| **Especialidades** | ✅ Activo | Catálogo médico y de enfermería. Tipos: medica, enfermeria, ambas. |
| **Citas** | ✅ Activo | Agendar, cancelar, posponer, confirmar. Validación de solapamiento + horario. Histórico. |
| **Notificaciones** | ✅ Activo | Email (Resend), WhatsApp (Twilio), SMS fallback. Estado: pendiente/enviada/fallida. SSE tiempo real. |
| **ChatIA** | ✅ Activo | Asistente de agendamiento vía chat. Métricas en logs estructurados. |
| **Panel admin** | ✅ Activo | Dashboard de administración (usuarios, doctores, citas). |
| **Panel enfermería** | ✅ Activo | Dashboard de enfermería. |
| **Dashboard médico** | ✅ Activo | Dashboard de doctores. |
| **Sitio promocional** | ✅ Activo | Landing page con hero, carousel, promocional toggle. |
| **i18n** | ✅ Activo | ES, PT, EN (paridad completa). |
| **Temas** | ✅ Activo | Light/dark theme. |

### Integraciones externas

| Servicio | Propósito | Estado | Notas |
|---|---|---|---| 
| Supabase PostgreSQL | Base de datos | ✅ Prod | Render free tier |
| Redis (Upstash/Render KV) | Cache + throttling | ✅ Configurado | REQUITE_ACCION_MANUAL en prod |
| Resend | Email transaccional | ⚠️ Configurado | RESEND_API_KEY no seteado en prod |
| Twilio | WhatsApp | ⚠️ Configurado | Sandbox por default, producción pago |
| Sentry | Error tracking | ✅ Configurado | SENTRY_DSN backend/frontend |
| Render Static Site | Frontend hosting | ✅ Prod | Vite build, static publish |
| UptimeRobot | Monitoring | ❌ Pendiente | Añadir para health check monitoring |

### Stack tecnológico

| Layer | Tecnología |
|---|---|
| Backend | Django 6.0 + Django REST Framework 3.16 |
| Frontend | React 19 + Vite 7 + React Hook Form |
| Base de datos | PostgreSQL 16 (Supabase) |
| Cache | Redis (django-redis) |
| Auth | JWT (djangorestframework-simplejwt) |
| Testing | pytest (backend), Vitest + Playwright (frontend) |

---

## Gaps y oportunidades de feature

### Funcionalidades candidatas

| Feature | Impacto (1-5) | Esfuerzo (1-5) | Prioridad | Depende de |
|---|---|---|---|---|
| **Historia clínica** | 5 | 4 | Alta | Modelos Cita/Paciente |
| **Recetas electrónicas** | 4 | 3 | Media-Alta | Historia clínica |
| **Recordatorios automáticos** | 4 | 2 | Alta | Celery (configurado) |
| **Reportes y analytics** | 4 | 2 | Media-Alta | DB indexes (FASE 7.1) |
| **Telemedicina (video consulta)** | 3 | 3 | Media | Jitsi/Twilio Video |
| **Pagos online** | 3 | 3 | Media | Stripe/MercadoPago |
| **Notificaciones push** | 3 | 2 | Media | Service Worker |
| **App móvil (PWA)** | 3 | 2 | Media | Manifest, SW |
| **Multi-tenant (multi-clínica)** | 5 | 5 | Baja-Alta | Arquitectura |
| **Facturación** | 4 | 4 | Baja-Alta | Localización fiscal |
| **Consentimientos informados** | 3 | 2 | Media | Historia clínica |
| **Historial de enfermería** | 3 | 2 | Media | Paciente/Cita |

---

## Roadmap en 3 horizontes

### Horizonte 1 — Consolidación (0-3 meses) ✅ En progreso

**Objetivo:** Resolver deuda técnica de auditoría, estabilizar producción, features de alto valor/rápido implementación.

| Feature | Esfuerzo | Prioridad | Owner | Estado |
|---|---|---|---|---|
| Provisionar Redis en Render | 0.5d | Crítica | Manual | ⚠️ Pending |
| Rotar SECRET_KEY en producción | 0.5h | Crítica | Manual | ⚠️ Pending |
| Setear RESEND_API_KEY | 0.5h | Crítica | Manual | ⚠️ Pending |
| Rotar demo credentials | 0.5h | Crítica | Manual | ⚠️ Pending |
| Migrar media a S3/R2 | 3d | Alta | Aprobación requerida | ⚠️ Pending |
| Aprobar/descartar migración ASGI | 2d | Media-Alta | Aprobación requerida | 🟦 Evaluación completada |
| **Recordatorios automáticos (email 24h antes)** | 3d | Alta | - | 🟩 Planificado |
| **Reportes de citas (admin dashboard)** | 2d | Media-Alta | - | 🟩 Planificado |
| **PWA manifest + service worker** | 2d | Media | - | 🟩 Planificado |
| Monitoring con UptimeRobot | 1h | Media | - | 🟩 Planificado |
| Aumentar cobertura tests a 70% | 8h | Alta | - | 🟩 En progreso |

### Horizonte 2 — Expansión clínica (3-6 meses)

**Objetivo:** Añadir funcionalidades clínicas core para mejorar flujo de trabajo.

| Feature | Esfuerzo | Prioridad | Owner | Estado |
|---|---|---|---|---|
| **Historia clínica básica** | 5d | Alta | - | 🟨 Pendiente |
| **Facturación (generación PDF)** | 4d | Media-Alta | - | 🟨 Pendiente |
| **Reportes y analytics avanzados** | 3d | Media-Alta | - | 🟨 Pendiente |
| **Mejoras ChatIA** (multi-idioma, más intenciones) | 4d | Media | - | 🟨 Pendiente |
| **Test E2E dashboard médico** | 2d | Media | - | 🟨 Pendiente |
| **Test E2E historial de enfermería** | 2d | Media | - | 🟨 Pendiente |

### Horizonte 3 — Diferenciación (6-12 meses)

**Objetivo:** Diferenciación competitiva, escala y monetización.

| Feature | Esfuerzo | Prioridad | Owner | Estado |
|---|---|---|---|---|
| **Telemedicina** (videollamadas) | 10d | Alta | - | 🟥 Pendiente |
| **Pagos online** | 6d | Media-Alta | - | 🟥 Pendiente |
| **Recetas electrónicas** | 5d | Media-Alta | - | 🟥 Pendiente |
| **App móvil nativa** (React Native) | 20d | Media-Alta | - | 🟥 Pendiente |
| **Multi-tenant** (multi-clínica) | 15d | Alta | - | 🟥 Pendiente |
| **Facturación integrada** (sistema fiscal local) | 10d | Media | - | 🟥 Pendiente |

---

## Métricas KPIs

### Técnicos

| KPI | Objetivo | Baseline | Herramienta | Frecuencia revisión |
|---|---|---|---|---|
| Cobertura de tests (backend) | ≥ 70% | ~60% (FASE 3) + 3 tests nuevos (FASE 7) | pytest-cov | Mensual |
| Cobertura de tests (frontend) | ≥ 70% | ~65% | vitest --coverage | Mensual |
| Error rate (frontend) | < 0.5% | N/A | Sentry | Diario |
| P95 latencia API | < 500ms | N/A | Sentry performance | Diario |
| Uptime | ≥ 99.5% | N/A | UptimeRobot/health | Diario |
| Queries por list endpoint | ≤ 3 | 41 (CitaViewSet) → 1 (fixed) | assertNumQueries | Por PR |

### Producto

| KPI | Objetivo | Baseline | Herramienta | Frecuencia revisión |
|---|---|---|---|---|
| Citas creadas/mes | 1000 | N/A | DB query | Mensual |
| Tasa de conversión ChatIA | ≥ 60% | N/A | Logs ChatIA metrics | Mensual |
| Tasa de cancelación | < 15% | N/A | DB query | Mensual |
| Usuarios activos/mes | 500 | N/A | Analytics | Mensual |
| Tasa de error auth | < 1% | N/A | Sentry | Diario |

---

## Deuda técnica

### Resuelta en auditoría (FASE 0-7)

| Ítem | FASE | Resolución |
|---|---|---|
| Email único (unique=True) | FASE 1 | Migración 0004_normalize_email.py |
| Horario CheckConstraint (hora_fin > hora_inicio) | FASE 1 | Constraint en modelo |
| Cita.duracion_minutos | FASE 3 | Campo + validación solapamiento |
| N+1 queries en serializers | FASE 7.1 | select_related en ViewSets |
| Índices faltantes | FASE 7.1 | Migración 000X_add_performance_indexes |
| Bundle 609 kB | FASE 7.2 | Lazy loading + code splitting → 333 kB |
| SSE bloquea workers WSGI | FASE 7.3 | Cache-based concurrency limiter |
| Sin CI/CD | FASE 6 | Workflows backend/frontend/e2e |
| Sin monitoring | FASE 6 | Sentry + health check |
| Sin documentación | FASE 6 | README, CHANGELOG, docs |

### Diferida conscientemente

| Ítem | Impacto | Esfuerzo | Urgencia | Decisión |
|---|---|---|---|---|
| Migración a ASGI (Uvicorn) | Alto (escala SSE) | Medio | Baja (actualmente 1-2 usuarios) | Postergado a Horizonte 1, decisión tras proyección de usuarios >50 concurrentes |
| Migrar media a S3/R2 | Alto (persistencia) | Medio | Media | Feature flag listo; pendiente aprobación |
| Cambio on_delete (Cita.paciente/doctor → PROTECT) | Medio (integridad) | Alto (migración + validación) | Baja | Documentado en AUDIT.md; pending decisión negocio |
| Refactorizar ChatIA.jsx (1077l) | Bajo (funciona) | Alto | Baja | Preservado como state machine cohesivo (FASE 4) |
| Test E2E admin/doctores/pacientes | Medio | Medio | Media | Planificado Horizonte 1-2 |

### Priorizada para Horizonte 1

| Ítem | Owner | Esfuerzo | Prioridad |
|---|---|---|---|
| Aumentar coverage a 70% | Equipo | 8h | Alta |
| Tests E2E dashboard médico | Equipo | 2d | Media-Alta |
| Notificaciones push (PWA) | Equipo | 2d | Media |

---

## Proceso de roadmap

### Actualización
- **Revisión mensual de KPIs** por el equipo.
- **Re-priorización trimestral** con el product owner.
- Cambios al roadmap → PR a `docs/ROADMAP.md` + review por 1 technical lead.

### Integración con CI/CD
- Cada feature del roadmap sigue el proceso de PR → CI (backend+frotend+e2e) → 1 reviewer → merge.
- `CHANGELOG.md` actualizado con cada release.
- Tagging de releases: `v1.x.0` tras merge a `main`.

### Enlaces
- Documentación del proyecto: [README.md](../README.md)
- Auditoría completa: [AUDIT.md](../AUDIT.md)
- Evaluaciones técnicas: [docs/architecture/]()
- Deuda técnica tracking: esta sección
