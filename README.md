# Gestão Saúde — Gestión de Citas Médicas

Plataforma de gestión de citas médicas para pacientes, doctores y enfermeros. El paciente puede agendar, cancelar y posponer citas; el doctor gestiona horarios y la enfermera apoya el proceso. Incluye un asistente conversacional de citas (antes ChatIA) para agendar citas vía interfaz conversacional.

## Estado actual

| Métrica | Valor | Target |
|---|---|---|
| Tests backend | 139 passed, 3 skipped | ≥ 136 |
| Tests frontend | 31 passed | ≥ 31 |
| Cobertura backend | ~62% | ≥ 70% (Horizonte 1) |
| Cobertura frontend | ~65% | ≥ 70% (Horizonte 1) |
| Bundle principal | 333 kB (101 kB gzip) | < 350 kB ✅ |
| N+1 queries | Eliminadas (select_related) | — |
| Uptime | — | ≥ 99.5% |

## Documentación

- **[README.md](README.md)** — este archivo
- **[AUDIT.md](AUDIT.md)** — auditoría completa FASE 0-7
- **[CHANGELOG.md](CHANGELOG.md)** — historial de cambios
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — guía de contribución
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — roadmap funcional y KPIs
- **[docs/er-diagram.md](docs/er-diagram.md)** — diagrama ER
- **[backend/LOGGING.md](backend/LOGGING.md)** — guía de logging estructurado
- **[docs/architecture/evaluation-asgi.md](docs/architecture/evaluation-asgi.md)** — evaluación ASGI vs WSGI
- **[docs/architecture/evaluation-media-storage.md](docs/architecture/evaluation-media-storage.md)** — migración media S3/R2

```
                    ┌─────────────────────────────────────┐
                    │           Render Free Tier            │
                    │  ┌──────────────┐  ┌──────────────┐  │
                    │  │   Backend    │  │   Frontend   │  │
                    │  │  (Django 6)  │  │  (React 19)  │  │
                    │  │  Gunicorn    │  │  Vite 7      │  │
                    │  │  SQLite/pg   │  │  Static Site │  │
                    │  └──────┬───────┘  └──────┬───────┘  │
                    │         │                  │          │
                    └─────────┼──────────────────┼──────────┘
                              │                  │
                    ┌─────────┴────────┐ Redis  │
                    │  Supabase DB      │───────┘
                    └──────────────────┘
                              │
                    ┌─────────┴────────┐
                    │  Upstash Redis   │  (cache + throttling)
                    └──────────────────┘

  Optional services (set via env vars):
  - Resend: transactional emails (free tier 3000/mo)
  - Twilio: WhatsApp/SMS notifications (free sandbox, paid prod)
  - Sentry: error tracking (free tier 5k errors/mo)
  - Render KV/Upstash: distributed cache (if REDIS_URL set)
```

## Requisitos

- **Python:** 3.12+ (testeado en 3.14.2)
- **Node.js:** 20+ (testeado en v24.21.0)
- **npm:** 11.19.0+
- **PostgreSQL:** 16+ (SQLite para dev)
- **Redis:** opcional (LocMemCache fallback en dev)

## Setup local

```bash
# 1. Clonar
git clone <repo-url>
cd Mis_proyectos

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate  # Linux: source, Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
cp .env.example .env
# Editar .env con tus valores
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# ¡Abierto en http://localhost:8000/

# 3. Frontend (en otra terminal)
cd ../frontend
npm ci
npm run dev
# ¡Abierto en http://localhost:5173/
```

## Comandos útiles

```bash
# Backend
python manage.py runserver           # dev server
python manage.py migrate             # aplicar migraciones
python manage.py makemigrations      # crear migraciones (nunca en prod)
python manage.py test                # tests unitarios
python manage.py check --deploy     # verificar configuración prod
python manage.py shell              # shell Django

# Tests
python -m pytest --cov=. --cov-report=term-missing  # todo con cobertura
python -m pytest backend/usuarios/tests/ -v          # tests específicos

# Frontend
npm run dev          # dev server
npm run lint         # ESLint
npm run test         # Jest/Vitest unit tests
npm run test:coverage # tests con cobertura
npm run i18n:check   # verificar paridad de claves i18n
npm run build        # build de producción

# E2E (requiere navegador Playwright)
npm run e2e

# Seed E2E (CI only)
python manage.py seed_e2e --password=E2ETest123!
```

## Estructura del proyecto

```
Mis_proyectos/
├── backend/                    # Django 6 API
│   ├── core/                   # Configuración del proyecto
│   │   ├── settings.py
│   │   ├── health.py           # [FASE 6] Health check
│   │   └── urls.py
│   ├── usuarios/               # App de usuarios, doctores, citas
│   │   ├── models.py           # Usuario, Doctor, Paciente, Cita, Horario
│   │   ├── ai_service.py       # Asistente de citas (no modificar, solo instrumentar)
│   │   ├── chat_metrics.py     # [FASE 5] Métricas Asistente de citas
│   │   ├── image_utils.py      # [FASE 5] Optimización WebP
│   │   ├── views/              # [FASE 3] Paquete de views
│   │   ├── serializers.py
│   │   └── management/
│   │       └── commands/       # seed_demo, seed_e2e, optimizar_imagenes
│   ├── notificaciones/         # Notificaciones, email, WhatsApp
│   │   ├── sse.py              # [FASE 5] SSE endpoint
│   │   ├── services.py
│   │   └── models.py
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/                   # React 19 + Vite 7
│   ├── src/
│   │   ├── components/         # UI components (incl. Asistente de citas descompuesto)
│   │   ├── hooks/              # Custom hooks (incl. useChatIA)
│   │   ├── services/           # API services + error handler
│   │   ├── context/            # React Context providers
│   │   ├── config/             # App constants
│   │   ├── i18n/               # i18n (ES, PT, EN)
│   │   └── test/               # MSW mock server + setup
│   ├── scripts/                # check-i18n.js
│   └── package.json
├── .github/workflows/          # CI/CD [FASE 6]
│   ├── backend-ci.yml
│   ├── frontend-ci.yml
│   └── e2e.yml
├── docs/
│   └── er-diagram.md           # Diagrama ER [FASE 6]
├── AUDIT.md                    # Documento de auditoría completa
├── CHANGELOG.md                # Historial de cambios
├── render.yaml                 # Configuración de despliegue
└── .env.example                # Variables de entorno (template)
```

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `SECRET_KEY` | ✅ Sí (prod) | — | Clave secreta de Django (rotar, nunca commitear) |
| `DEBUG` | ✅ Sí | `'False'` | `'True'` para desarrollo |
| `ALLOWED_HOSTS` | ✅ Sí (prod) | — | Hosts permitidos (comma-separated) |
| `DATABASE_URL` | ✅ Sí | — | URL de conexión a PostgreSQL (Supabase) |
| `REDIS_URL` | ⚠️ Si cache activo | — | URL de Redis (Upstash/Render KV) |
| `EMAIL_HOST_USER` | ❌ No | — | Para SMTP fallback |
| `RESEND_API_KEY` | ❌ No | — | [FASE 5] Resend email provider |
| `SENTRY_DSN` | ❌ No | — | [FASE 6] Sentry backend DSN |
| `TWILIO_ACCOUNT_SID` | ❌ No | — | Para WhatsApp/SMS |
| `TWILIO_AUTH_TOKEN` | ❌ No | — | Para WhatsApp/SMS |
| `TWILIO_WHATSAPP_NUMBER` | ❌ No | — | Número de WhatsApp empresarial |

### Frontend

| Variable | Obligatoria | Default | Descripción |
|---|---|---|---|
| `VITE_API_URL` | ✅ Sí | — | URL base de la API (`https://host.onrender.com/api`) |
| `VITE_SENTRY_DSN` | ❌ No | — | [FASE 6] Sentry frontend DSN |

## Testing

### Unit tests (backend)
```bash
python -m pytest --cov=. --cov-report=term-missing
```

### Unit tests (frontend)
```bash
npm run test
npm run test:coverage
```

### E2E (Playwright)
```bash
npm run e2e
```

## Troubleshooting

### Puerto 8000 ocupado
```bash
lsof -i :8000     # Linux/Mac
kill $(lsof -t -i:8000)
```

### Error: "REDIS_URL must be set in production"
- En dev: `REDIS_URL=redis://localhost:6379/0` (si tienes Redis corriendo).
- Sin Redis: `DEBUG=True` activa LocMemCache fallback.

### Error: "SECRET_KEY must be set in production"
- En prod: setear `SECRET_KEY` como secret en Render.
- En dev: `SECRET_KEY=test-key DEBUG=True python manage.py runserver`.

### Tests fallan con "No such table"
- Asegúrate de haber corrido `python manage.py migrate` o usa `pytest-django` que crea la DB de test automáticamente.

### Node: "port 5173 in use"
```bash
npx kill-port 5173
npm run dev
```

## Chatbot / Asistente de citas

**Asistente de citas (basado en reglas).** Módulo conversacional que guía al usuario
a través de una máquina de estados para agendar, cancelar o consultar horarios de
citas. Utiliza detección de intenciones por palabras clave y procesamiento de
fechas en lenguaje natural acotado (PT/ES/EN). **No implementa modelos de IA**;
su arquitectura está diseñada para permitir la integración futura de un modelo de
lenguaje sin refactor mayor (los estados de la conversación están desacoplados de
la lógica de intención).

## Contribuir

1. Crea un branch: `git checkout -b feat/nueva-funcionalidad`
2. Haz commit con Conventional Commits: `feat: descripción`
3. Push: `git push origin feat/nueva-funcionalidad`
4. Abre PR → CI debe pasar en verde.
5. Al menos 1 reviewer.

### Convenciones de commit
- `feat:` nueva funcionalidad
- `fix:` arreglo de bug
- `perf:` mejora de rendimiento
- `refactor:` refactorización sin cambios de comportamiento
- `docs:` documentación
- `test:` tests
- `ci:` configuración CI/CD
- `perf(5.1):` para cambios asociados a FASE 5 §5.1, etc.

### Política de migraciones
- **Nunca** `makemigrations` en producción.
- En CI se verifica `--check --dry-run` (FASE 6.1.2).
- Resolver migraciones locales antes de mergear a `main`.

## Despliegue

El proyecto despliega en **Render** usando `render.yaml`:
- Backend: servicio Python (Django + Gunicorn).
- Frontend: Static Site (Vite).
- PostgreSQL y Redis como servicios gestionados.

```bash
# Verificar readiness antes de deploy
bash scripts/verify_deploy_readiness.sh
```

## Licencia

Este proyecto está bajo desarrollo activo. Consulta con el propietario del repositorio para términos de licencia.
