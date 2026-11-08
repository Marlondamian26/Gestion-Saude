# Arquitectura y estructura técnica

## Estructura de archivos

```
Mis_proyectos/
├── .env.example                  # Plantilla de variables de entorno
├── .github/
│   └── workflows/
│       ├── backend-ci.yml        # CI del backend (pytest, cobertura, makemigrations --check)
│       ├── frontend-ci.yml       # CI del frontend (vitest, lint, i18n check)
│       └── e2e.yml               # E2E con Playwright
├── backend/                      # API Django 6
│   ├── core/                     # Configuración del proyecto (settings, urls, health, wsgi/asgi)
│   ├── usuarios/                 # App principal: usuarios, doctores, citas, asistente de citas
│   ├── notificaciones/           # App de notificaciones (email, WhatsApp, SMS, SSE, modelo Notificacion)
│   ├── requirements.txt          # Dependencias de producción
│   ├── requirements-dev.txt      # Dependencias de desarrollo/testing
│   ├── manage.py
│   └── conftest.py / pytest.ini
├── frontend/                     # Plataforma principal (React 19 + Vite 7)
│   ├── src/
│   │   ├── components/           # UI (Dashboard, Citas, Perfil, Doctores, Login, Registro, ChatIA, …)
│   │   ├── context/              # React Context (Auth, Language, Theme, Notificaciones)
│   │   ├── services/             # Servicios API (auth, chatService, errorHandler)
│   │   ├── hooks/                # Custom hooks (useChatIA, …)
│   │   └── config/               # Constantes de la app
│   ├── package.json
├── promo-frontend/               # Sitio promocional independiente (React 19 + Vite 7)
│   ├── src/
│   │   ├── sitioPromocional/     # Componentes (Hero, Carousel, Navbar, Servicios, …)
│   │   ├── context/              # Traducciones (promo.js)
│   │   └── config/               # constants.js (datos de clínica, URLs, servicios)
│   ├── package.json
├── docs/                         # Documentación técnica
│   ├── API.md
│   ├── MODELO_DATOS.md
│   ├── OPERACIONES.md
│   ├── architecture/             # Evaluaciones ASGI, media-storage, promo-separation
│   └── er-diagram.md             # Diagrama Entidad-Relación (Mermaid)
├── render.yaml                   # Despliegue declarativo en Render (3 servicios)
├── scripts/
│   └── verify_deploy_readiness.sh # Verificación fail-fast antes de desplegar
└── README.md                     # Este archivo
```

## Tecnologías y herramientas

### Backend

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| Lenguaje | Python | 3.12+ | Lógica de servidor |
| Framework web | Django | 6.0.2 | ORM, admin, API base |
| API REST | Django REST Framework | 3.16.1 | Serializadores, ViewSets, paginación, throttling |
| Autenticación | djangorestframework-simplejwt | 5.5.1 | JWT (access + refresh tokens) |
| CORS | django-cors-headers | 4.9.0 | Cabeceras CORS |
| Base de datos | PostgreSQL (Supabase) / SQLite (dev) | 16+ / nativo | Almacenamiento relacional |
| Conexión DB | dj-database-url | 3.1.2 | Parseo de `DATABASE_URL` |
| Driver PostgreSQL | psycopg[binary] | 3.2.13 | Adaptador de PostgreSQL |
| Caché / Rate limit | Redis + django-redis | 8.1.0 / 7.0.0 | Caché compartida, rate limiting, sesiones SSE |
| Colas (tareas) | Celery | 5.5.3 | Tareas en segundo plano (recordatorios de citas) |
| Servidor WSGI | Gunicorn | 25.1.0 | Servidor de producción para Django (Render) |
| Archivos estáticos | WhiteNoise | 6.7.0 | Servir static/media en producción |
| Almacenamiento S3 | django-storages[s3] + boto3 | 1.14.6 / 1.43.123 | Supabase Storage (S3-compatible) para media en prod |
| Email transaccional | django-anymail[resend] | 11.1 | Proveedor Resend (opcional) |
| Reintentos de email | tenacity | 9.0.0 | Reintentos exponenciales en envío de email |
| WhatsApp/SMS | twilio | 9.10.2 | WhatsApp y SMS como canal de notificación |
| Imágenes | Pillow | 12.1.1 | Validación MIME real, redimensionado, conversión WebP |
| Copias de seguridad | django-dbbackup | 4.1.0 | Backup de base de datos |
| Observabilidad | sentry-sdk[celery,postgres] | 2.35.0 | Rastreo de errores y rendimiento |
| Logging estructurado | python-json-logger | 3.2.0 | Logs JSON en producción |
| Testing | pytest + pytest-django | — | Tests unitarios del backend |

### Frontend (plataforma y sitio promocional)

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| Lenguaje | JavaScript (React) | — | Interfaz de usuario |
| Framework UI | React | 19.2.0 | Componentes y hooks |
| Construcción | Vite | 7.3.1 | Servidor de desarrollo y build de producción |
| Enrutamiento | react-router-dom | 7.13.1 | Navegación SPA |
| Formularios | react-hook-form | 7.71.2 | Gestión y validación de formularios |
| Iconos | react-icons | 5.5.0 | Iconografía |
| Fechas | date-fns | 4.1.0 | Formateo y manipulación de fechas |
| JWT (cliente) | jwt-decode | 4.0.0 | Decodificación de tokens JWT en frontend |
| Observabilidad | @sentry/react | 9.28.1 | Rastreo de errores frontend (opcional) |
| HTTP cliente | axios | 1.13.5 | Peticiones a la API backend |
| Testing | Vitest + Testing Library | 5.0.3 / 16.3.3 | Tests unitarios y de componentes |
| E2E | Playwright | 1.63.0 | Tests de extremo a extremo (promo-frontend) |
| Mock de API | MSW | 2.15.0 | Mock de respuestas HTTP en tests |
| Linting | ESLint | 9.39.1 | Análisis estático de JS/JSX |
| i18n | Manual (diccionarios JS) | ES, PT, EN | Internacionalización de la UI |
| Estilos | CSS puro + CSS variables | — | Temas light/dark, diseño responsive |

### Herramientas y plataforma de despliegue

| Herramienta | Propósito |
|-------------|-----------|
| Render | Alojamiento del backend (servicio Python), frontend y sitio promocional (Static Sites) |
| Supabase | Base de datos PostgreSQL gestionada y Storage (S3-compatible) para media |
| Upstash / Render KV | Redis para caché y rate limiting |
| Resend | Servicio de email transaccional |
| Twilio | WhatsApp y SMS |
| Sentry | Monitoreo de errores y rendimiento |
| GitHub Actions | CI/CD: backend-ci, frontend-ci, e2e |

## Diagrama de arquitectura

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

  Sitio promocional (promo-frontend) — Static Site independiente en Render
  Conecta con la misma API backend y sincroniza idioma/tema vía query params.
```

## Decisiones técnicas clave

### ¿Por qué SSE y no WebSocket para notificaciones?
SSE funciona sobre HTTP estándar, es más sencillo de operar en Render (servicio Python + Gunicorn) y no requiere mantener conexiones bidireccionales persistentes por trabajador. Se incluye un limitador de conexiones concurrentes (2 en WSGI) y fallback a polling si la conexión falla.

### ¿Por qué máquina de estados y no LLM externo para el asistente?
El asistente de citas está basado en reglas con detección de intenciones por palabras clave. La arquitectura está desacoplada para permitir la integración futura de un modelo de lenguaje sin refactorizar los estados de la conversación. No depende de APIs externas de IA.

### ¿Por qué Supabase Storage para imágenes?
Permite separar los archivos multimedia del filesystem del backend, necesario en Render donde el filesystem es efímero. Las imágenes se validan con Pillow (MIME real), se redimensionan a WebP y se firman con expiración de 7 días.

### Backend: WSGI (Gunicorn)
El proyecto usa Gunicorn con WSGI en producción. Existe una alternativa ASGI documentada (`docs/architecture/evaluation-asgi.md`) para migrar si se necesita escalar las conexiones SSE.

### Separación backend / frontend / promo
El sitio promocional (`promo-frontend`) es un Static Site independiente que consume la misma API backend. Sincroniza idioma y tema con la plataforma principal mediante query params (`?lang=`, `?theme=`).

## Enlaces relacionados

- `docs/API.md` — endpoints completos y autenticación JWT.
- `docs/MODELO_DATOS.md` — tablas, relaciones, restricciones e índices.
- `docs/architecture/evaluation-asgi.md` — evaluación ASGI vs WSGI.
- `docs/architecture/evaluation-media-storage.md` — migración media a S3/R2.
- `docs/architecture/cross-origin-sync.md` — contrato de sincronización promo ↔ plataforma.
- `docs/er-diagram.md` — diagrama Entidad-Relación (Mermaid).
