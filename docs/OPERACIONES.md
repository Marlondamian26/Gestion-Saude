# Operaciones y despliegue

## Configuración y variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Default | Descripción |
|----------|-------------|---------|-------------|
| `SECRET_KEY` | ✅ (prod) | — | Clave secreta de Django (nunca commitear) |
| `DEBUG` | ✅ | `'False'` | `'True'` para desarrollo |
| `ALLOWED_HOSTS` | ✅ (prod) | — | Hosts permitidos (coma-separados) |
| `DATABASE_URL` | ✅ | — | URL PostgreSQL (Supabase) |
| `REDIS_URL` | ⚠️ (caché activo) | — | URL de Redis (Upstash/Render KV); LocMem fallback en dev |
| `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | ❌ | — | SMTP fallback |
| `RESEND_API_KEY` | ❌ | — | Proveedor email Resend (requiere aprobación en prod) |
| `SENTRY_DSN` | ❌ | — | Sentry backend |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_NUMBER` | ❌ | — | WhatsApp/SMS |
| `MEDIA_STORAGE` | ✅ (prod) | `filesystem` | `filesystem` local o `s3` (Supabase Storage) |
| `SUPABASE_STORAGE_BUCKET` | ✅ con `s3` | `gestion-saude-media` | Bucket privado de Supabase Storage |
| `SUPABASE_S3_ENDPOINT` / `SUPABASE_S3_ACCESS_KEY` / `SUPABASE_S3_SECRET_KEY` | ✅ con `s3` | — | Credenciales S3 de Supabase (solo backend) |
| `SUPABASE_S3_REGION` | ❌ con `s3` | `us-east-1` | Región S3 |
| `TERMS_VERSION` | ❌ | `2026-11` | Versión de términos aceptada |
| `RENDER_GIT_COMMIT` | ❌ | `local-dev` | Commit para versión en health check |

### Almacenamiento de imágenes
- Desarrollo local: `MEDIA_STORAGE=filesystem`, archivos en `backend/media/`.
- Producción en Render: `MEDIA_STORAGE=s3` con credenciales de Supabase Storage. Las URLs de medios se firman y expiran en 7 días.
- Migración de archivos existentes: `python manage.py migrate_media_to_s3 --dry-run` (listado) / `--apply` (copia y actualiza referencias; no borra originales).

### Frontend (`.env` en `frontend/`)
| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_API_URL` | ✅ | URL base de la API (`https://host.onrender.com/api`) |
| `VITE_PROMO_URL` | ❌ | URL del sitio promocional |
| `VITE_SENTRY_DSN` | ❌ | Sentry frontend |

### Sitio promocional (`.env` en `promo-frontend/`)
| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_API_URL` | ✅ | URL de la API backend |
| `VITE_PLATFORM_URL` | ✅ | URL de la plataforma principal |

## Despliegue (Render)

El proyecto despliega en **Render** mediante `render.yaml` con tres servicios:

### 1. Backend — `Gestion-Saude-backend` (servicio Python, plan Free, región Oregon)
- **Build:** `pip install -r requirements.txt && python manage.py check --deploy --fail-level WARNING && python manage.py migrate --noinput && python manage.py collectstatic --noinput`
- **Start:** `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers ${RENDER_CPU_COUNT:-1} --threads 4 --timeout 120`
- Variables inyectadas por Render: `DATABASE_URL` (desde base de datos gestionada), `SECRET_KEY` (generado por Render), `REDIS_URL` (generado si se añade Redis add-on).

### 2. Frontend — `Gestion-Saude-frontend` (Static Site, plan Free)
- **Build:** `npm ci && npm run build`, publica `dist/`.
- Rewrites `/*` → `/index.html` (SPA).
- Variables: `VITE_API_URL`, `VITE_PROMO_URL`.

### 3. Sitio promocional — `Gestion-Saude-promo` (Static Site, plan Free)
- **Build:** `npm ci && npm run build`, publica `dist/`.
- Rewrites `/*` → `/index.html`.
- Variables: `VITE_API_URL`, `VITE_PLATFORM_URL`.

### Base de datos y caché gestionadas
- PostgreSQL gestionado por Supabase (conexión vía `DATABASE_URL`).
- Redis opcional (Upstash o Render KV) para caché y rate limiting; en dev se usa `LocMemCache`.

## Verificación de readiness antes de desplegar

```bash
bash scripts/verify_deploy_readiness.sh
```
Ejecuta 5 pasos: `check --deploy --fail-level WARNING`, `makemigrations --check --dry-run`, `collectstatic --dry-run`, fallo sin `SECRET_KEY` en prod, fallo sin `REDIS_URL` en prod.

## Testing y calidad

### Backend (pytest)
```bash
cd backend
python -m pytest                         # todos los tests
python -m pytest --cov=. --cov-report=term-missing  # con cobertura
python manage.py check --deploy          # verificar configuración prod
python manage.py makemigrations --check --dry-run   # no migraciones pendientes
```
- Cobertura backend: ~62% (target ≥ 70%).
- Tests backend: 139 passed, 3 skipped (target ≥ 136).

### Frontend (Vitest)
```bash
cd frontend
npm run test               # tests unitarios
npm run test:coverage      # con cobertura
npm run lint               # ESLint
npm run i18n:check         # paridad de claves i18n
npm run build              # build de producción
```
- Tests frontend: 31 passed.
- Cobertura frontend: ~65%.

### E2E (Playwright, promo-frontend)
```bash
cd promo-frontend
npm run e2e        # tests E2E
```
Requiere `seed_e2e` para poblar datos de prueba (solo CI/DEBUG).

### Métricas de calidad (KPIs)
- Cobertura tests backend ≥ 70%; frontend ≥ 70.
- Error rate frontend < 0.5% (Sentry).
- P95 latencia API < 500 ms.
- Uptime ≥ 99.5%.
- Queries por list endpoint ≤ 3 (N+1 eliminadas con `select_related`).

## Comandos de gestión Django

| Comando | App | Descripción |
|---------|-----|-------------|
| `seed_demo` | usuarios | Crea admin genérico y paciente demo (solo `DEBUG=True`). |
| `seed_e2e` | usuarios | Seed para tests E2E (solo CI/DEBUG). |
| `optimizar_imagenes` | usuarios | Optimización por lote de imágenes (dry-run por defecto, `--apply`). |
| `migrate_media_to_s3` | usuarios | Migración de media de filesystem a S3/Supabase Storage. |
| `backup_db` | core | Copia de seguridad de la base de datos con django-dbbackup. |

## Logging estructurado y observabilidad

- Logging: JSON en producción, texto legible en desarrollo; campos `timestamp`, `level`, `logger`, `module`, `func`, `lineno`.
- Sentry backend y frontend (DSN opcional, scrubbing de PII en headers `Authorization`/`Cookie`/`X-Api-Key`).
- Rate limiting de API: usuarios autenticados 60/min, anónimos 30/min, registro 5/min.
- Health check `GET /health/` (DB, caché, Redis; rate limit 10 req/min por IP; no expone versiones ni hostnames).
- Health check de DB `GET /health/db/`.
