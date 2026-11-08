# Gestion-Saude — Plataforma de gestión médica multi-rol

> Sistema full-stack para clínica y consultorio en Luanda (Angola): agendamiento con roles, notificaciones en tiempo real y asistente conversacional extensible.

<!-- TODO: enlace a demo en vivo (Render) cuando esté disponible -->

**Stack principal:** Django REST · React · PostgreSQL · SSE · JWT · GitHub Actions

## Visión general / problema

El consultorio Dra. Belkis Morejón Acosta gestiona citas médicas de forma manual, sin trazabilidad clara ni notificaciones centralizadas. Gestion-Saude digitaliza el flujo: pacientes agendan, cancelan y posponen citas; doctores gestionan horarios y citas asignadas; enfermería apoya el proceso; administradores tienen control total del sistema. Incluye un asistente conversacional basado en reglas y entrega de notificaciones en tiempo real vía SSE con fallback multi-canal (WhatsApp → SMS → email → in-app).

## Demo y capturas

<!-- TODO: URL de demo en Render -->

<!-- TODO: captura del flujo de agendamiento -->

<!-- TODO: captura del panel de notificaciones -->

## Características destacadas

- Notificaciones en tiempo real con SSE y fallback multi-canal (WhatsApp → SMS → email → in-app).
- Asistente de agendamiento basado en máquina de estados (sin dependencia de LLM), diseñado para integrar un modelo de lenguaje en el futuro sin refactorizar.
- Modelo de datos con restricciones de integridad a nivel de base de datos (CheckConstraint de horarios, UniqueConstraint de citas activas, índices compuestos).
- Seguridad: JWT con permisos granulares por rol + throttling de registro + validación real de MIME en imágenes.

El resto de funcionalidades (CRUD de usuarios/doctores/enfermeras/pacientes/especialidades/horarios/citas, modo oscuro, responsive, panel de enfermería, i18n en ES/PT/EN) se detallan en `docs/ARQUITECTURA.md`.

## Stack y arquitectura

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Django | 6.0.2 | Framework web y ORM |
| Django REST Framework | 3.16.1 | API REST |
| djangorestframework-simplejwt | 5.5.1 | Autenticación JWT |
| PostgreSQL (Supabase) | 16+ | Base de datos |
| Redis | 8.1.0 | Caché y rate limiting |
| React | 19.2.0 | Interfaz de usuario |
| Vite | 7.3.1 | Build y dev server |

```
                    ┌─────────────────────────────────────┐
                    │           Render Free Tier            │
                    │  ┌──────────────┐  ┌──────────────┐  │
                    │  │   Backend    │  │   Frontend   │  │
                    │  │  (Django 6)  │  │  (React 19)  │  │
                    │  │  Gunicorn    │  │  Vite 7      │  │
                    │  └──────┬───────┘  └──────┬───────┘  │
                    │         │                  │          │
                    └─────────┼──────────────────┼──────────┘
                              │                  │
                    ┌─────────┴────────┐ Redis  │
                    │  Supabase DB      │───────┘
                    └──────────────────┘
```

Sitio promocional (`promo-frontend`): Static Site independiente en Render, conecta con la misma API backend. Enlace al detalle: `docs/ARQUITECTURA.md`.

## Cómo ejecutar (local)

Requisitos: Python 3.12+, Node.js 20+, PostgreSQL 16+ (SQLite para dev), Redis opcional.

```bash
# 1. Clonar
git clone <repo-url>
cd Mis_proyectos

# 2. Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
cp .env.example .env   # editar con tus valores
python manage.py migrate
python manage.py runserver   # http://localhost:8000/

# 3. Frontend (en otra terminal)
cd ../frontend
npm ci
npm run dev   # http://localhost:5173/

# 4. Tests
cd ../backend && python -m pytest
cd ../frontend && npm run test
```

Variables de entorno: ver `.env.example` en la raíz y `backend/.env`. Enlace al detalle de despliegue: `docs/OPERACIONES.md`.

## Decisiones técnicas clave

- **SSE y no WebSocket** para notificaciones: funciona sobre HTTP estándar, más sencillo de operar en Render y no requiere conexiones bidireccionales persistentes por trabajador.
- **Máquina de estados y no LLM externo** para el asistente: desacoplado para integrar un modelo de lenguaje futuro sin refactorizar; no depende de APIs externas de IA.
- **Supabase Storage para imágenes**: el filesystem de Render es efímero; las imágenes se validan con Pillow (MIME real), se convierten a WebP y se firman con expiración de 7 días.
- **Backend WSGI (Gunicorn) en producción**: existe una alternativa ASGI evaluada en `docs/architecture/evaluation-asgi.md` para escalar SSE si fuera necesario.
- **Sitio promocional separado** (`promo-frontend`): Static Site independiente que consume la misma API y sincroniza idioma/tema con la plataforma vía query params.

## Próximos pasos / evolución planificada

- Provisionar Redis en Render y rotar `SECRET_KEY` y `RESEND_API_KEY` en producción.
- Migrar media a S3/R2 (Supabase Storage) y validar el bucket en producción.
- Recordatorios automáticos de citas (email 24 h antes) vía Celery.
- Reportes de citas en el dashboard de administrador.
- Aumentar cobertura de tests a ≥ 70% (backend y frontend).

## Documentación adicional

- [API — endpoints completos y autenticación JWT](docs/API.md)
- [Arquitectura — diagrama, tecnologías y decisiones técnicas](docs/ARQUITECTURA.md)
- [Operaciones y despliegue — CI/CD, variables de entorno, testing](docs/OPERACIONES.md)
- [Modelo de datos — tablas, relaciones, restricciones e índices](docs/MODELO_DATOS.md)
- [Diagrama Entidad-Relación](docs/er-diagram.md)

## Métricas de impacto

- Cobertura de tests backend: <!-- TODO: indicar % real de pytest -->
- Cobertura de tests frontend: <!-- TODO: indicar % real de Vitest -->
- Endpoints REST documentados: <!-- TODO: contar en docs/API.md -->
- Roles y permisos granulares implementados: <!-- TODO: confirmar número -->
- Latencia media de agendamiento (entorno de demo): <!-- TODO: medir o eliminar -->
