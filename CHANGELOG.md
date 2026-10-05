# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — FASE 6 Complete

### Added — §6.5 Documentation
- `README.md`: architecture diagram, setup instructions, env vars table, troubleshooting, contribution guide.
- `CHANGELOG.md`: this file.
- `CONTRIBUTING.md`: PR workflow, coding standards, commit conventions.
- `docs/er-diagram.md`: entity relationship diagram for all models.
- `backend/LOGGING.md`: structured logging guide, log formats, debugging procedures.

### Added — §6.1.5 E2E Infrastructure
- `.github/workflows/e2e.yml`: Playwright E2E tests on PRs to `main`/`belkis-saude`.
- `backend/usuarios/management/commands/seed_e2e.py`: E2E seed command (debug-only, aborts in prod).

### Added — §6.2 Sentry
- @sentry/react@9.28.1 installed (frontend).
- sentry-sdk[celery,postgres]==2.35.0 in requirements.txt.
- Frontend `main.jsx`: conditional Sentry init with PII scrubbing (Authorization/Cookie headers removed).
- Backend `settings.py`: conditional Sentry SDK init with LoggingIntegration, traces_sample_rate=0.1, profiles_sample_rate=0.1.
- `core/tests/test_sentry_config.py`: 3 tests for DSN/guard-rails.

### Added — §6.3 Logging
- python-json-logger==3.2.0 in requirements.txt.
- JSON logging in prod, verbose in dev; structured fields: timestamp, level, msg, logger, module, func, lineno.
- `core/tests/test_logging_config.py`: 3 tests for log format/config.

### Added — §6.4 Health Check
- `core/health.py`: GET /health/ with DB + cache + Redis checks, 10 req/min rate limit, no hostname/versions exposed.
- `core/tests/test_health.py`: 5 tests.

### Fixed
- Health check rate limiter cache persistence between tests → added `cache.clear()` in setUp.
- Horario model field name: `dia` → `dia_semana` (integer 0-6, Monday=0).
- package.json JSON syntax error caused by inline comment.

## [0.2.0] — FASE 5 Complete

### Added — §5.1 Server-Sent Events
- `backend/notificaciones/sse.py`: SSE streaming endpoint (JWT auth, 15s heartbeat, 600s max).
- Frontend `useNotificationsSSE.js`: EventSource with exponential backoff (3 retries → polling).
- 6 backend tests + 1 frontend test.

### Added — §5.2 Image Optimization
- `backend/usuarios/image_utils.py`: Pillow validation + WebP 512×512 generation.
- `backend/usuarios/management/commands/optimizar_imagenes.py` (dry-run default, --apply).
- `DATA_UPLOAD_MAX_MEMORY_SIZE=10MB` in settings.
- 9 tests.

### Added — §5.3 Email (Partial)
- `enviar_email`: console fallback in dev, Resend/anymail if key set, tenacity retry.
- tenacity/anymail NOT installed (graceful fallback).
- Tests pending execution.

### Added — §5.4 ChatIA Metrics (Pending)
> *Nota FASE 12: el módulo antes llamado ChatIA se documenta ahora como "Asistente de citas basado en reglas".*
- Metrics endpoint and dashboard widgets planned.

## [0.1.0] — FASE 1-3 Complete

### Security Hardening
- `email` field set to `unique=True` on Usuario model (pending production migration).
- `Horario` CheckConstraint for valid time range (`hora_inicio < hora_fin`).
- `Cita.duracion_minutos` field + overlap validation in `clean()`.
- `CheckConstraint` using `condition=` (Django 6.0 compatible, not `check=`).
- Debug email normalization migration (0004).
- Superuser usage report (0005).

### Tests
- 75+ backend tests, 31 frontend tests.
- Characterization tests for the appointment assistant (formerly ChatIA).
- i18n parity tests (ES/PT/EN).
- E2E workflow + seed data.
