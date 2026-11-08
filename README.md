# Gestão Saúde — Gestión de Citas Médicas

Plataforma de gestión de citas médicas para pacientes, doctores y enfermeros. El paciente puede agendar, cancelar y posponer citas; el doctor gestiona horarios y la enfermera apoya el proceso. Incluye un asistente conversacional de citas (antes ChatIA) para agendar citas vía interfaz conversacional, un sitio promocional independiente y un sistema de notificaciones multi-canal (email, WhatsApp, SMS) con entrega en tiempo real vía SSE.

---

## Tabla de contenidos

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Estructura de archivos](#estructura-de-archivos)
3. [Tecnologías, lenguajes y herramientas](#tecnologías-lenguajes-y-herramientas)
4. [Funcionalidades implementadas](#funcionalidades-implementadas)
5. [Base de datos](#base-de-datos)
6. [API REST — endpoints](#api-rest-endpoints)
7. [Autenticación y autorización (JWT)](#autenticación-y-autorización-jwt)
8. [Asistente de citas (basado en reglas)](#asistente-de-citas-basado-en-reglas)
9. [Notificaciones](#notificaciones)
10. [Configuración y variables de entorno](#configuración-y-variables-de-entorno)
11. [Despliegue (Render)](#despliegue-render)
12. [Testing y calidad](#testing-y-calidad)
13. [Comandos de gestión Django](#comandos-de-gestión-django)
14. [Roadmap y deuda técnica](#roadmap-y-deuda-técnica)
15. [Contribuir](#contribuir)
16. [Licencia](#licencia)

---

## Descripción del proyecto

**Gestão Saúde** es una plataforma web full-stack de gestión de citas médicas orientada a clínicas y consultorios. Consta de tres piezas principales:

- **Backend (API)** — Django 6 + Django REST Framework, expone una API REST bajo `/api/` con autenticación JWT, CRUD de usuarios/doctores/enfermeras/pacientes/especialidades/horarios/citas, un asistente conversacional de citas basado en reglas y notificaciones con entregas en tiempo real vía Server-Sent Events (SSE).
- **Frontend principal (React)** — React 19 + Vite 7, aplicación de plataforma para pacientes, doctores y enfermeros con dashboards por rol, gestión de citas, chat del asistente, perfil con foto de perfil y notificaciones.
- **Sitio promocional (promo-frontend)** — React 19 + Vite 7 independiente, landing page pública de la clínica (hero, carrusel, servicios, testimonios, legal) con sincronización de idioma y tema con la plataforma principal.

El proyecto está diseñado para desplegarse en **Render** (backend como servicio Python y frontend/sitio como Static Sites) con **PostgreSQL gestionado (Supabase)** y **Redis** para caché y rate limiting.

### Alcance y roles de usuario

| Rol | Qué puede hacer |
|-----|-----------------|
| `admin` | Gestión total de usuarios, doctores, enfermeras, citas, especialidades, horarios y recepción de notificaciones de administración. |
| `doctor` | Gestionar su propio perfil, horarios de atención y citas asignadas; confirmar/cancelar/posponer citas. |
| `nurse` (enfermería) | Gestionar su propio perfil y apoyar el proceso de citas; ver citas. |
| `patient` (paciente) | Registrarse, agendar/cancelar/posponer citas, usar el asistente conversacional, editar perfil y foto, ver notificaciones. |

---

## Estructura de archivos

```
Mis_proyectos/
├── .env.example                  # Plantilla de variables de entorno
├── .gitignore
├── .kilo/                        # Configuración de Kilo (agentes, comandos, skills)
├── .github/
│   └── workflows/
│       ├── backend-ci.yml        # CI del backend (pytest, cobertura, makemigrations --check)
│       ├── frontend-ci.yml       # CI del frontend (vitest, lint, i18n check)
│       └── e2e.yml               # E2E con Playwright (requiere seed_e2e)
├── AUDIT.md                      # Auditoría completa FASE 0-7
├── CHANGELOG.md                  # Historial de cambios (Keep a Changelog)
├── CONTRIBUTING.md               # Guía de contribución, convenciones de commit
├── GUIDE-RENDER-DEPLOYMENT.txt   # Guía detallada de despliegue en Render
├── Notas.md                      # Notas de desarrollo internas
├── README.md                     # Este archivo
├── render.yaml                   # Despliegue declarativo en Render (3 servicios)
├── requirements.lock.txt         # Lock completo de dependencias Python
├── requirements.txt              # Direct de Python (root, informativo)
├── frontend-deps.txt             # Listado de dependencias del frontend
├── scripts/
│   └── verify_deploy_readiness.sh # Verificación fail-fast antes de desplegar (5 pasos)
├── backups/                      # Respaldo de copias de seguridad de DB
├── backend/                      # API Django 6
│   ├── core/                     # Configuración del proyecto
│   │   ├── __init__.py
│   │   ├── asgi.py               # Punto de entrada ASGI (alternativa a WSGI)
│   │   ├── health.py             # [FASE 6 §6.4] Health check (DB, cache, Redis, rate limit)
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── backup_db.py  # Backup de base de datos con django-dbbackup
│   │   ├── media/                # Archivos multimedia subidos (dev, filesystem)
│   │   │   └── perfiles/
│   │   ├── migrations/           # Migraciones de core (si las hubiera)
│   │   ├── settings.py           # Configuración Django (ver sección Configuración)
│   │   ├── test_settings.py      # Settings para pytest (DEBUG=True, fail-fast env)
│   │   ├── urls.py               # Rutas raíz: admin, /health/, /health/db/, /api/token/*, /api/
│   │   ├── wsgi.py               # Punto de entrada WSGI (usado por Gunicorn en Render)
│   │   ├── __pycache__/
│   │   └── tests/                # Tests de configuración (Sentry, logging, health)
│   ├── usuarios/                 # App principal: usuarios, doctores, citas, asistente de citas
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── ai_service.py         # Asistente de citas basado en reglas (máquina de estados)
│   │   ├── chat_metrics.py       # [FASE 5 §5.5] Métricas del asistente (logs estructurados, sin PII)
│   │   ├── image_utils.py        # [FASE 5 §5.2] Validación MIME real + redimensionado WebP con Pillow
│   │   ├── management/
│   │   │   └── commands/
│   │   │       ├── limpiar_datos.py
│   │   │       ├── migrate_media_to_s3.py  # Migración filesystem -> S3/Supabase Storage
│   │   │       ├── optimizar_imagenes.py   # Optimización por lotes de imágenes (dry-run default)
│   │   │       ├── seed_demo.py              # Usuarios bootstrap (admin + paciente demo, solo DEBUG)
│   │   │       └── seed_e2e.py               # Seed para tests E2E (solo DEBUG/CI)
│   │   ├── migrations/           # Migraciones de la app usuarios (0001...000X)
│   │   ├── models.py             # Modelos: Usuario, Especialidad, Doctor, Enfermera, Paciente, Horario, Cita, SitioImagen
│   │   ├── serializers.py        # Serializadores DRF + CustomTokenObtainPairSerializer (login email/tel/usuario)
│   │   ├── tests/                # Tests unitarios de usuarios/citas/chat
│   │   ├── urls.py               # Rutas de la app usuarios (/api/usuarios/, /api/citas/, /api/chat-ia/, etc.)
│   │   ├── views/
│   │   │   ├── __init__.py       # Re-export de todas las vistas públicas
│   │   │   ├── auth.py           # Registro, usuario actual, cambio de contraseña, foto de perfil, login JWT
│   │   │   ├── citas.py          # CitaViewSet (agendar/cancelar/confirmar), mis_citas
│   │   │   ├── chat.py           # chat_ia (POST), chat_ia_sugerencias (GET)
│   │   │   ├── doctores.py       # DoctorViewSet, doctores_publicos, mi_perfil_doctor
│   │   │   ├── enfermeras.py     # EnfermeraViewSet, especialistas_publicos, mi_perfil_enfermera
│   │   │   ├── especialidades.py # EspecialidadViewSet, especialidades_publicas, medicas/enfermeria
│   │   │   ├── horarios.py       # HorarioViewSet, acción disponibles
│   │   │   ├── pacientes.py      # PacienteViewSet, buscar_pacientes
│   │   │   └── sitio.py          # SitioImagenViewSet (carrusel/hero públicos)
│   │   ├── conftest.py
│   │   └── pytest.ini
│   ├── notificaciones/           # App de notificaciones (email, WhatsApp, SMS, SSE, modelo Notificacion)
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── ai_service.py
│   │   ├── migrations/
│   │   ├── models.py             # Notificacion (tipo, estado, leida, intentos, GenericForeignKey a Cita)
│   │   ├── serializers.py
│   │   ├── services.py           # ServicioNotificaciones (email Resend/SMTP, WhatsApp/SMS Twilio, fallback en cadena)
│   │   ├── sse.py                # NotificacionesSSEView (GET /api/notificaciones/stream/?token=...)
│   │   ├── tasks.py              # Tareas Celery: enviar_recordatorios_citas, procesar_respuestas_confirmacion
│   │   ├── tests/
│   │   ├── urls.py               # /api/notificaciones/ + /api/notificaciones/stream/
│   │   ├── views.py              # NotificacionViewSet (marcar leída, todas leídas, no leídas, últimas)
│   │   └── __pycache__/
│   ├── db.sqlite3                # Base de datos SQLite de desarrollo local
│   ├── media/                    # Archivos multimedia subidos (dev, filesystem)
│   ├── requirements-dev.txt      # Dependencias de desarrollo y testing del backend
│   ├── requirements.txt          # Dependencias de producción del backend
│   ├── conftest.py
│   ├── pytest.ini
│   └── manage.py
├── frontend/                     # Plataforma principal (React 19 + Vite 7)
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js            # (implícito) configuración de Vite
│   ├── eslint.config.js / .eslintrc
│   ├── vitest.config.js          # (implícito) configuración de Vitest
│   ├── scripts/
│   │   └── check-i18n.js         # Verificación de paridad de claves i18n (ES/PT/EN)
│   ├── public/
│   ├── src/
│   │   ├── main.jsx              # Punto de entrada (Sentry condicional, providers)
│   │   ├── App.jsx               # Router principal
│   │   ├── index.css / App.css
│   │   ├── assets/
│   │   ├── components/           # Componentes UI (Dashboard, Citas, Perfil, Doctores, Login, Registro, ChatIA, NotificacionesCampana, ...)
│   │   │   └── chat/             # Subcomponentes del chat (ChatHeader, ChatMessage, ChatInput, ChatMessageList, ChatSuggestions, ChatPatientPicker)
│   │   ├── hooks/                # Custom hooks (useChatIA, ...)
│   │   ├── context/              # React Context (AuthContext, LanguageContext, ThemeContext, NotificacionesContext)
│   │   │   └── translations/     # Diccionarios i18n (platform.js: ES, PT, EN)
│   │   ├── config/               # constantes de la app
│   │   ├── services/             # Servicios API (auth.js, chatService.js, errorHandler.js, apiUtils.js)
│   │   ├── styles/               # theme.css, components-responsive.css
│   │   ├── utils/                # storage.js, syncPreferences.js
│   │   └── test/                 # setup.js + msw-server.js (mock de API para tests)
│   └── __tests__ / components/__tests__ / hooks/__tests__ / ...
├── promo-frontend/               # Sitio promocional independiente (React 19 + Vite 7)
│   ├── README.md
│   ├── package.json
│   ├── package-lock.json
│   ├── docs/design-system.md     # Sistema de diseño del sitio promocional
│   ├── src/
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── sitioPromocional/
│   │   │   ├── components/       # Hero, Carousel, Navbar, Servicios, Testimonios, SobreNosotros, Footer, CTA, LanguageToggle, ThemeToggle, LandingWrapper, LegalPage
│   │   │   ├── pages/            # Privacidad, Terminos
│   │   │   ├── styles/           # tokens.css, primitives.css, promocional.css, promo-responsive.css
│   │   │   ├── hooks/            # useInView, usePrefersReducedMotion
│   │   │   ├── config/           # constants.js (datos de clínica, URLs, servicios)
│   │   │   └── __tests__/
│   │   ├── context/              # LanguageContext, ThemeContext
│   │   │   └── translations/promo.js  # Diccionarios i18n del promo
│   │   ├── utils/                # apiUtils.js, syncPreferences.js
│   │   └── test/                 # setup.js + msw-server.js
│   └── test-results/             # Resultados de tests E2E (Playwright)
└── docs/
    ├── er-diagram.md             # Diagrama Entidad-Relación (Mermaid)
    ├── architecture/
    │   ├── evaluation-asgi.md               # Evaluación ASGI vs WSGI
    │   ├── evaluation-media-storage.md      # Migración media a S3/R2 (Supabase Storage)
    │   ├── cross-origin-sync.md             # Contrato de sincronización idioma/tema promo <-> plataforma
    │   ├── evaluation-promo-separation.md   # Evaluación de separación del sitio promocional
    │   └── evaluation-promo-independence.md # Evaluación de independencia del promo
    └── ROADMAP.md                # Roadmap funcional, KPIs, horizonte 1-3, deuda técnica
```

---

## Tecnologías, lenguajes y herramientas

### Backend

| Capa | Tecnología | Versión | Propósito |
|------|------------|---------|-----------|
| Lenguaje | Python | 3.12+ (testeado en 3.14.2) | Lógica de servidor |
| Framework web | Django | 6.0.2 | ORM, admin, API base |
| API REST | Django REST Framework | 3.16.1 | Serializadores, ViewSets, paginación, throttling |
| Autenticación | djangorestframework-simplejwt | 5.5.1 | JWT (access + refresh tokens), login por email/teléfono/usuario |
| CORS | django-cors-headers | 4.9.0 | Cabeceras CORS para el frontend |
| Base de datos | PostgreSQL (Supabase) / SQLite (dev) | 16+ / nativo | Almacenamiento relacional |
| Conexión DB | dj-database-url | 3.1.2 | Parseo de `DATABASE_URL` |
| Driver PostgreSQL | psycopg[binary] | 3.2.13 | Adaptador de PostgreSQL para Django |
| Caché / Rate limit | Redis + django-redis | 8.1.0 / 7.0.0 | Caché compartida, rate limiting, sesiones SSE |
| Colas (tareas) | Celery | 5.5.3 | Tareas en segundo plano (recordatorios de citas) |
| Servidor WSGI | Gunicorn | 25.1.0 | Servidor de producción para Django (Render) |
| Archivos estáticos | WhiteNoise | 6.7.0 | Servir static/media en producción |
| Almacenamiento S3 | django-storages[s3] + boto3 | 1.14.6 / 1.43.123 | Supabase Storage (S3-compatible) para media en prod |
| Email transaccional | django-anymail[resend] | 11.1 | Proveedor Resend (opcional, requiere aprobación) |
| Reintentos de email | tenacity | 9.0.0 | Reintentos exponenciales en envío de email |
| WhatsApp/SMS | twilio | 9.10.2 | WhatsApp y SMS como canal de notificación |
| Imágenes | Pillow | 12.1.1 | Validación MIME real, redimensionado, conversión WebP |
| Copias de seguridad | django-dbbackup | 4.1.0 | Backup de base de datos |
| Observabilidad | sentry-sdk[celery,postgres] | 2.35.0 | Rastreo de errores y rendimiento (opcional) |
| Logging estructurado | python-json-logger | 3.2.0 | Logs JSON en producción |
| HTTP cliente | requests | 2.32.5 | Peticiones HTTP salientes |
| Testing | pytest + pytest-django | — | Tests unitarios del backend |
| Cobertura | pytest-cov | — | Medición de cobertura de tests |

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
| Upstash / Render KV | Redis para caché y rate limiting (opcional en dev, recomendado en prod) |
| Resend | Servicio de email transaccional (nivel gratuito 3.000 emails/mes) |
| Twilio | WhatsApp y SMS (sandbox en pruebas, pago en producción) |
| Sentry | Monitoreo de errores y rendimiento (nivel gratuito) |
| GitHub Actions | CI/CD: backend-ci, frontend-ci, e2e |
| Docker / venv | Entornos aislados de Python |

---

## Funcionalidades implementadas

### 1. Usuarios y autenticación
- Registro público de usuarios con rol seleccionable (`admin`, `doctor`, `nurse`, `patient`).
- Aceptación obligatoria de términos y privacidad (`acepta_terminos`, versión de términos registrada).
- Email opcional pero único (`null=True, blank=True, unique=True`).
- Autenticación JWT con `djangorestframework-simplejwt`: login por username, email o número de teléfono; tokens de acceso (60 min) y refresh (1 día).
- Endpoint `/api/token/` (obtener), `/api/token/refresh/`, `/api/token/verify/`.
- Obtención del usuario autenticado (`/api/usuario-actual/`), cambio de contraseña, gestión de foto de perfil (subida y eliminación).
- Foto de perfil: validación MIME real con Pillow, redimensionado a 512×512 y conversión a WebP (máx. 5 MB).
- Throttling dedicado para registro público (`RegistroAnonThrottle`, 5/min).
- Sincronización automática de perfil `Paciente` cuando un usuario adopta el rol `patient` (señal `post_save`).

### 2. Perfiles profesionales
- **Doctor**: especialidad (FK), otra especialidad libre, biografía; perfil editable (`mi_perfil_doctor`).
- **Enfermera**: especialidad (opcional), otra especialidad, número de licencia, biografía; perfil editable (`mi_perfil_enfermera`).
- **Paciente**: alergias, grupo sanguíneo, contacto de emergencia, teléfono de emergencia.
- Endpoints públicos (autenticados) para listar doctores, especialistas (doctores + enfermeras) y especialidades activas, con caché de 5 minutos.

### 3. Especialidades
- Catálogo médico y de enfermería con tipo (`medica`, `enfermeria`, `ambas`) y estado activo/inactivo.
- Acciones personalizadas: `medicas` y `enfermeria` para filtrar por tipo.

### 4. Horarios de atención
- Un doctor define horarios por día de la semana (0=Lunes … 6=Domingo) con hora de inicio y fin.
- `CheckConstraint`: `hora_fin > hora_inicio`.
- `unique_together`: (doctor, día, hora_inicio, hora_fin).
- Endpoint `disponibles` para consultar horarios de un doctor en una fecha específica.
- Índices compuestos para consultas frecuentes por doctor + día + activo.

### 5. Citas médicas
- Agendar, cancelar, posponer y confirmar citas.
- Campos: paciente, doctor, fecha, hora, estado (`pendiente`, `confirmada`, `completada`, `cancelada`, `no_asistio`), motivo, notas internas, duración (10–240 min, default 30).
- Validaciones: no solapamiento con citas existentes (considerando duración), hora dentro del horario activo del doctor, no agendar en horas pasadas.
- `UniqueConstraint` para citas activas (no canceladas) por (doctor, fecha, hora), permitiendo rebooking de slots liberados.
- Índices para consultas frecuentes: (doctor, fecha, estado) y (paciente, fecha).
- `select_related` en `paciente__usuario` y `doctor__usuario` para eliminar consultas N+1.
- Notificaciones automáticas al crear, confirmar, cancelar y posponer citas.

### 6. Asistente de citas (basado en reglas)
- Módulo conversacional (`usuarios/ai_service.py`) que guía al usuario mediante una **máquina de estados** (`inicio` → `especialidad` → `fecha` → `doctor` → `hora` → `confirmar`; además `cancelar` y `ver_horarios`).
- Detección de intenciones por palabras clave en ES/PT/EN.
- Procesamiento de fechas en lenguaje natural acotado (`hoy`, `mañana`, días de la semana, `DD/MM/YYYY`, `15 de enero de 2024`).
- Listado de especialidades activas, doctores disponibles por fecha y especialidad, horarios libres (slots de 30 min).
- Creación atómica de la cita con prevención de race conditions (verificación de disponibilidad dentro de `transaction.atomic`).
- Persistencia de la sesión de chat en Django Cache (clave por paciente, TTL 1 h, limpieza automática de servicios antiguos).
- Métricas estructuradas (`usuarios/chat_metrics.py`) sin PII: sesión iniciada, intención detectada, intención no reconocida, cita creada, sesión abandonada, errores.
- Endpoints: `POST /api/chat-ia/` y `GET /api/chat-ia/sugerencias/`.
- **Nota:** no implementa modelos de IA externos; la arquitectura está diseñada para permitir la integración futura de un modelo de lenguaje sin refactor mayor.

### 7. Notificaciones
- Modelo `Notificacion`: tipo (recordatorio, confirmación, cancelación, nueva cita, modificación, disponibilidad), estado (`pendiente`, `enviada`, `fallida`), leída/no leída, intentos de envío, relación genérica con `Cita` mediante `GenericForeignKey`.
- Canales: email (Resend vía django-anymail o SMTP fallback; reintentos exponenciales con tenacity), WhatsApp y SMS (Twilio), con cadena de fallback WhatsApp → SMS → Email → in-app.
- Envío automático al crear/confirmar/cancelar/posponer citas y al registrar administradores o actualizar fotos de perfil de profesionales.
- Endpoints del ViewSet `NotificacionViewSet`: listar mis notificaciones, marcar como leída, marcar todas como leídas, no leídas, últimas 10.
- **SSE (Server-Sent Events)**: `GET /api/notificaciones/stream/?token=<jwt>` para entrega en tiempo real sin polling; heartbeat cada 15 s, corte a los 600 s, limitador de conexiones concurrentes (2 en WSGI). Fallback a polling si falla 3 veces.
- Tarea Celery `enviar_recordatorios_citas` para recordatorios 24 h antes.

### 8. Sitio promocional (promo-frontend)
- Landing pública independiente con hero, carrusel, sección de servicios, testimonios, sobre nosotros, contacto, pie de página.
- Páginas legales: privacidad y términos.
- i18n completo (ES, PT, EN) con paridad de claves.
- Temas claro/oscuro y diseño accesible (skip link, focus visible, `aria-live`, `prefers-reduced-motion`, navegación por teclado).
- Sincronización cross-origen con la plataforma principal mediante query params `?lang=` y `?theme=`.
- Modelo backend `SitioImagen` para gestionar imágenes del carrusel y hero (endpoint público `carousel` y `hero`, CRUD restringido).

### 9. Internacionalización (i18n)
- Idiomas: español, portugués, inglés.
- Diccionarios centralizados en `frontend/src/context/translations/platform.js` y `promo-frontend/src/context/translations/promo.js`.
- Script `npm run i18n:check` para verificar paridad de claves entre idiomas.
- Cambio de idioma y tema persistido y sincronizable entre plataformas.

### 10. Observabilidad y operaciones
- Health check `GET /health/` (DB, caché, Redis; rate limit 10 req/min por IP; no expone versiones ni hostnames).
- Health check de DB `GET /health/db/`.
- Logging estructurado: JSON en producción, texto legible en desarrollo; campos `timestamp`, `level`, `logger`, `module`, `func`, `lineno`.
- Sentry backend y frontend (DSN opcional, scrubbing de PII en headers `Authorization`/`Cookie`/`X-Api-Key`).
- Rate limiting de API: usuarios autenticados 60/min, anónimos 30/min, registro 5/min.
- Verificación de readiness antes de desplegar (`scripts/verify_deploy_readiness.sh`, 5 pasos fail-fast).
- Migraciones nunca se generan en producción; CI verifica `makemigrations --check --dry-run`.

---

## Base de datos

En desarrollo local se usa **SQLite** (`backend/db.sqlite3`). En producción se usa **PostgreSQL 16 gestionado por Supabase** a través de `DATABASE_URL` con `conn_max_age=600`, `ssl_require=True` y health checks de conexión.

### Modelos principales (`backend/usuarios/models.py`)

**Usuario** (extiende `AbstractUser`, `AUTH_USER_MODEL = 'usuarios.Usuario'`)
- `username`, `password`, `first_name`, `last_name`, `email` (unique, nullable), `rol` (`admin`/`doctor`/`nurse`/`patient`, default `patient`), `telefono`, `foto_perfil` (ImageField), `fecha_nacimiento`, `terminos_aceptados`, `fecha_aceptacion_terminos`, `version_terminos_aceptada`.
- Índice en `rol`.

**Especialidad**
- `nombre` (unique), `descripcion`, `tipo_especialidad` (`medica`/`enfermeria`/`ambas`), `activo`.

**Doctor** (1:1 con Usuario)
- `especialidad` (FK), `otra_especialidad`, `biografia`, `fecha_registro`.

**Enfermera** (1:1 con Usuario)
- `especialidad` (FK, nullable), `otra_especialidad`, `numero_licencia`, `biografia`.

**Paciente** (1:1 con Usuario)
- `alergias`, `grupo_sanguineo` (A+, A-, …, O-), `contacto_emergencia`, `telefono_emergencia`.

**Horario**
- `doctor` (FK), `dia_semana` (0-6), `hora_inicio`, `hora_fin`, `activo`.
- CheckConstraint `hora_fin > hora_inicio`; unique_together (doctor, dia_semana, hora_inicio, hora_fin); índice (doctor, dia_semana, activo).

**Cita**
- `paciente` (FK), `doctor` (FK), `fecha`, `hora`, `estado` (`pendiente`/`confirmada`/`completada`/`cancelada`/`no_asistio`, default `pendiente`), `motivo`, `notas_adicionales`, `duracion_minutos` (10-240, default 30), `fecha_creacion`, `fecha_actualizacion`.
- UniqueConstraint para citas activas (doctor, fecha, hora); índices (doctor, fecha, estado) y (paciente, fecha).

**SitioImagen**
- `titulo`, `descripcion`, `imagen`, `tipo` (`hero`/`carousel`/`galería`), `orden`, `activo`, `fecha_creacion`.

**Notificacion** (`backend/notificaciones/models.py`)
- `usuario` (FK), `tipo`, `titulo`, `mensaje`, `leida`, `estado` (`pendiente`/`enviada`/`fallida`), `intentos`, `content_type`/`object_id` (GenericForeignKey a Cita), `fecha_creacion`, `fecha_envio`.
- Índices (usuario, leida) y (usuario, estado).

### Relaciones clave (ver `docs/er-diagram.md`)

| Relación | Tipo | Notas |
|----------|------|-------|
| Usuario → Doctor | 1:1 | Cascade |
| Usuario → Enfermera | 1:1 | Cascade |
| Usuario → Paciente | 1:1 | Cascade |
| Doctor → Especialidad | N:1 | FK |
| Enfermera → Especialidad | N:1 | FK (nullable) |
| Doctor → Horario | 1:N | unique on (doctor, dia, inicio, fin) |
| Cita → Doctor | N:1 | FK |
| Cita → Paciente | N:1 | FK |
| Notificacion → Usuario | N:1 | FK |
| Notificacion → Cita | N:1 | FK nullable (GenericFK) |

---

## API REST — endpoints

Todas las rutas bajo `/api/` (definidas en `backend/core/urls.py` e `backend/usuarios/urls.py`, más `backend/notificaciones/urls.py`).

### Autenticación
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/token/` | Obtener par de tokens JWT (login por usuario/email/teléfono) | No |
| POST | `/api/token/refresh/` | Refrescar access token | No |
| POST | `/api/token/verify/` | Verificar token | No |

### Usuarios
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/registro/` | Registro público de usuario | No (throttle 5/min) |
| GET | `/api/usuario-actual/` | Datos del usuario autenticado | Sí |
| POST | `/api/cambiar-contrasena/` | Cambiar contraseña | Sí |
| GET/PUT/PATCH/DELETE | `/api/usuarios/` | CRUD de usuarios (ViewSet) | Sí |
| POST/DELETE | `/api/foto-perfil/` | Subir/eliminar foto de perfil propio | Sí |
| POST/DELETE | `/api/foto-perfil/<id>/` | Subir/eliminar foto de otro usuario (solo admin) | Sí (admin) |

### Citas
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/citas/` | Listar/crear citas | Sí |
| GET/PUT/PATCH/DELETE | `/api/citas/<id>/` | Detalle/actualizar/eliminar cita | Sí |
| POST | `/api/citas/<id>/cancelar/` | Cancelar cita | Sí |
| POST | `/api/citas/<id>/confirmar/` | Confirmar cita | Sí |
| GET | `/api/mis-citas/` | Citas del usuario actual | Sí |

### Doctores / Enfermeras / Especialidades / Pacientes / Horarios
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/doctores/` | CRUD doctores | Sí |
| GET | `/api/doctores-publicos/` | Listar doctores públicos (caché 5 min) | Sí |
| GET/PUT/PATCH | `/api/mi-perfil-doctor/` | Perfil propio del doctor | Sí |
| GET/POST | `/api/enfermeras/` | CRUD enfermeras | Sí |
| GET | `/api/especialistas-publicos/` | Doctores + enfermeras unificados | Sí |
| GET/PUT/PATCH | `/api/mi-perfil-enfermera/` | Perfil propio de enfermera | Sí |
| GET/POST | `/api/especialidades/` | CRUD especialidades | Sí |
| GET | `/api/especialidades-publicas/` | Especialidades activas (caché 5 min) | Sí |
| GET | `/api/especialidades/medicas/` | Solo especialidades médicas activas | Sí |
| GET | `/api/especialidades/enfermeria/` | Solo especialidades de enfermería activas | Sí |
| GET/POST | `/api/pacientes/` | CRUD pacientes | Sí |
| GET | `/api/buscar-pacientes/?query=` | Buscar pacientes por nombre/username | Sí |
| GET/POST | `/api/horarios/` | CRUD horarios | Sí |
| GET | `/api/horarios/disponibles/?doctor=&fecha=` | Horarios disponibles de un doctor en una fecha | Sí |

### Asistente de citas
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/chat-ia/` | Enviar mensaje al asistente (máquina de estados) | Sí |
| GET | `/api/chat-ia/sugerencias/` | Obtener sugerencias según estado de conversación | Sí |

### Imágenes del sitio promocional
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/sitio-imagenes/` | Listar imágenes (filtros `tipo`, `activo`) | Público (list/retrieve) |
| GET | `/api/sitio-imagenes/carousel/` | Imágenes del carrusel activas | Público |
| GET | `/api/sitio-imagenes/hero/` | Imagen hero activa | Público |
| POST/PUT/PATCH/DELETE | `/api/sitio-imagenes/` | CRUD de imágenes | Sí (auth) |

### Notificaciones
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/notificaciones/` | Listar/crear notificaciones propias | Sí |
| GET/PUT/PATCH/DELETE | `/api/notificaciones/<id>/` | Detalle/actualizar/eliminar notificación | Sí (dueño) |
| POST | `/api/notificaciones/marcar_todas_leidas/` | Marcar todas como leídas | Sí |
| POST | `/api/notificaciones/<id>/marcar_leida/` | Marcar una como leída | Sí |
| GET | `/api/notificaciones/no_leidas/` | Notificaciones no leídas | Sí |
| GET | `/api/notificaciones/ultimas/` | Últimas 10 notificaciones | Sí |
| GET | `/api/notificaciones/stream/?token=JWT` | Stream SSE en tiempo real | Sí |

### Salud del sistema
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/health/` | Health check completo (DB, caché, Redis) | No |
| GET | `/health/db/` | Health check de base de datos | No |

---

## Autenticación y autorización (JWT)

- Backend configura `REST_FRAMEWORK` con `JWTAuthentication` como primera clase, seguido de `SessionAuthentication` (para navegador) y `BasicAuthentication`.
- Permiso por defecto: `IsAuthenticated`; endpoints públicos (`registro`, chat-ia requiere auth, sitio-imagenes list/retrieve público) se excepcionsan en las vistas.
- `CustomTokenObtainPairSerializer` permite autenticar con `username`, `email` o `telefono`.
- Regla de acceso a citas: pacientes ven solo sus citas; doctores/enfermeras ven las citas donde son el profesional; admin ve todas.
- SSE autentica mediante `AccessToken` pasado por query param (`?token=`) porque `EventSource` no admite cabeceras personalizadas.

---

## Asistente de citas (basado en reglas)

Implementado en `backend/usuarios/ai_service.py` como `ServicioIA` con máquina de estados (`EstadoConversacion`):

- `INICIO` → detecta intención (agendar / ver horarios / cancelar).
- `ESPECIALIDAD` → selecciona especialidad activa.
- `FECHA` → procesa fecha (`hoy`, `mañana`, día de semana, formato numérico).
- `DOCTOR` → lista doctores disponibles con horarios para esa fecha/especialidad.
- `HORA` → muestra slots libres de 30 min y selecciona uno.
- `CONFIRMAR` → resume la cita y pide confirmación; al confirmar crea la cita atómicamente.
- `CANCELAR` → lista citas activas del paciente y permite cancelar una.
- `VER_HORARIOS` → muestra doctores y días de una especialidad.

La sesión se persiste en **Django Cache** (Redis en prod, LocMem en dev) con clave `chatia_servicio_<paciente_id>`, TTL 1 h y limpieza automática cuando excede 100 servicios concurrentes. Las métricas se emiten a `chatia.metrics` sin PII (mensajes truncados a 200 chars, emails/teléfonos sanitizados).

---

## Notificaciones

Implementado en `backend/notificaciones/services.py` (`ServicioNotificaciones`):

- **Email**: Resend vía `django-anymail` si `RESEND_API_KEY` está definido; SMTP como fallback; consola en desarrollo. Reintentos exponenciales con `tenacity` (3 intentos, espera 2-30 s).
- **WhatsApp/SMS**: Twilio con validación E.164. Cadena de fallback: WhatsApp → SMS → Email → in-app.
- Notificaciones automáticas: cita creada, confirmada, cancelada, pospuesta, recordatorio 24 h, registro de admin, actualización de foto de perfil de profesionales, cambios de horarios/especialidades/imágenes del sitio.
- El modelo `Notificacion` rastrea estado e intentos de envío.
- SSE para entrega en tiempo real (`backend/notificaciones/sse.py`).

---

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
| `GENERIC_ADMIN_USERNAME` / `GENERIC_ADMIN_PASSWORD` | ❌ (solo DEBUG) | — | Admin genérico para `seed_demo` |
| `DEMO_PATIENT_USERNAME` / `DEMO_PATIENT_PASSWORD` | ❌ (solo DEBUG) | — | Paciente demo para `seed_demo` |

### Almacenamiento de imágenes
- Desarrollo local: `MEDIA_STORAGE=filesystem`, archivos en `backend/media/`.
- Producción en Render: `MEDIA_STORAGE=s3` con credenciales de Supabase Storage. Las URLs de medios se firman y expiran en 7 días.
- Migración de archivos existentes: `python manage.py migrate_media_to_s3 --dry-run` (listado) / `--apply` (copia y actualiza referencias; no borra originales).

### Frontend (`.env` en `frontend/`)

| Variable | Obligatoria | Default | Descripción |
|----------|-------------|---------|-------------|
| `VITE_API_URL` | ✅ | — | URL base de la API (ej. `https://gestion-saude-backend.onrender.com/api`) |
| `VITE_PROMO_URL` | ❌ | — | URL del sitio promocional |
| `VITE_SENTRY_DSN` | ❌ | — | Sentry frontend |
| `VITE_PLATFORM_URL` | ❌ | — | URL de la plataforma (solo promo) |

### Sitio promocional (`.env` en `promo-frontend/`)

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `VITE_API_URL` | ✅ | URL de la API backend |
| `VITE_PLATFORM_URL` | ✅ | URL de la plataforma principal |

---

## Despliegue (Render)

El proyecto despliega en **Render** mediante `render.yaml` con tres servicios:

### 1. Backend — `Gestion-Saude-backend` (servicio Python, plan Free, región Oregon)
- **Build:** `pip install -r requirements.txt && python manage.py check --deploy --fail-level WARNING && python manage.py migrate --noinput && python manage.py collectstatic --noinput`
- **Start:** `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers ${RENDER_CPU_COUNT:-1} --threads 4 --timeout 120`
- Alternativa ASGI: `uvicorn core.asgi:application --host 0.0.0.0 --port $PORT --workers 1 --limit-concurrency 1000`
- Variables de entorno inyectadas por Render: `DATABASE_URL` (desde base de datos gestionada), `SECRET_KEY` (generado por Render), `REDIS_URL` (generado si se añade Redis add-on).
- `MEDIA_STORAGE=s3` en producción.

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

### Verificación de readiness antes de desplegar
```bash
bash scripts/verify_deploy_readiness.sh
```
Ejecuta 5 pasos: `check --deploy --fail-level WARNING`, `makemigrations --check --dry-run`, `collectstatic --dry-run`, fallo sin `SECRET_KEY` en prod, fallo sin `REDIS_URL` en prod.

---

## Testing y calidad

### Backend (pytest)
```bash
cd backend
# Variables de entorno de test (test_settings.py las define)
python -m pytest                         # todos los tests
python -m pytest --cov=. --cov-report=term-missing  # con cobertura
python -m pytest backend/usuarios/tests/ -v         # tests específicos
python manage.py check --deploy          # verificar configuración prod
python manage.py makemigrations --check --dry-run   # no migraciones pendientes
```
- Cobertura backend actual: ~62% (target ≥ 70%, Horizonte 1).
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
- Tests frontend: 31 passed (target ≥ 31).
- Cobertura frontend: ~65% (target ≥ 70%).

### E2E (Playwright, promo-frontend)
```bash
cd promo-frontend
npm run e2e        # tests E2E
npm run e2e:ui     # interfaz de Playwright
```
Requiere `seed_e2e` para poblar datos de prueba (solo CI/DEBUG).

### Métricas de calidad (KPIs)
- Cobertura tests backend ≥ 70%; frontend ≥ 70.
- Error rate frontend < 0.5% (Sentry).
- P95 latencia API < 500 ms.
- Uptime ≥ 99.5%.
- Queries por list endpoint ≤ 3 (N+1 eliminadas con `select_related`).

---

## Comandos de gestión Django

| Comando | App | Descripción |
|---------|-----|-------------|
| `seed_demo` | usuarios | Crea admin genérico y paciente demo (solo `DEBUG=True`; credenciales por env vars). |
| `seed_e2e` | usuarios | Seed para tests E2E (solo CI/DEBUG). |
| `optimizar_imagenes` | usuarios | Optimización por lote de imágenes (dry-run por defecto, `--apply` para ejecutar). |
| `migrate_media_to_s3` | usuarios | Migración de media de filesystem a S3/Supabase Storage (`--dry-run` / `--apply`). |
| `limpiar_datos` | usuarios | Limpieza de datos (consultar implementación). |
| `backup_db` | core | Crea copia de seguridad de la base de datos con django-dbbackup. |

---

## Roadmap y deuda técnica

Ver `docs/ROADMAP.md` y `AUDIT.md`.

- **Horizonte 1 (Consolidación):** provisionar Redis en Render, rotar `SECRET_KEY`, setear `RESEND_API_KEY`, migrar media a S3/R2, recordatorios automáticos 24 h, reportes de citas, PWA, UptimeRobot, cobertura ≥ 70%.
- **Horizonte 2 (Expansión clínica):** historia clínica básica, facturación PDF, reportes avanzados, mejoras al asistente de citas, tests E2E dashboard médico/enfermería.
- **Horizonte 3 (Diferenciación):** telemedicina, pagos online, recetas electrónicas, app móvil React Native, multi-tenant.

Deuda técnica diferida conscientemente: migración a ASGI (postergada a >50 usuarios concurrentes), `on_delete=PROTECT` en citas, refactor de `ChatIA.jsx`.

---

## Contribuir

1. Crea una rama: `git checkout -b feat/nueva-funcionalidad`
2. Haz commit con Conventional Commits: `feat: descripción`, `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `ci:`.
3. Push: `git push origin feat/nueva-funcionalidad`
4. Abre PR; CI debe pasar en verde (backend + frontend + e2e).
5. Al menos 1 reviewer antes del merge.

### Política de migraciones
- Nunca ejecutar `makemigrations` en producción.
- En CI se verifica `makemigrations --check --dry-run`.
- Resolver migraciones locales antes de mergear a la rama principal.

---

## Licencia

Este proyecto está bajo desarrollo activo. Consulta con el propietario del repositorio para términos de licencia.
