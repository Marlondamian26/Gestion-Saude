# Contributing to Gestão Saúde

¡Gracias por contribuir! Este documento describe cómo participar en el desarrollo del proyecto.

## Tabla de contenidos

- [Proceso de desarrollo](#proceso-de-desarrollo)
- [Estructura del código](#estructura-del-código)
- [Estándares de código](#estándares-de-código)
- [Testing](#testing)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [CI/CD](#cicd)

## Proceso de desarrollo

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd Mis_proyectos
   ```

2. **Crear un branch feature**
   ```bash
   git checkout -b feat/nombre-funcionalidad
   ```

3. **Desarrollar localmente**
   ```bash
   # Backend
   cd backend && python -m venv venv && source venv/bin/activate
   pip install -r requirements.txt && pip install -r requirements-dev.txt
   python manage.py migrate && python manage.py runserver

   # Frontend
   cd ../frontend && npm ci && npm run dev
   ```

4. **Commit y push**
   ```bash
   git add .
   git commit -m "feat: descripción"
   git push origin feat/nombre-funcionalidad
   ```

5. **Abrir Pull Request**
   - Dirigir a `main` o `staging`.
   - Describir cambios, motivación y testing realizado.
   - Al menos 1 reviewer técnico.

## Estructura del código

### Backend (`backend/`)
```
backend/
├── core/                     # Configuración del proyecto
│   ├── settings.py           # Django settings (prod-aware, fail-fast)
│   ├── health.py             # Health check endpoint
│   └── urls.py              # Rutas raíz
├── usuarios/                 # App principal
│   ├── models.py            # Entidades: Usuario, Doctor, Paciente, Cita, Horario
│   ├── serializers.py       # Serializers DRF
│   ├── views/               # Vistas (paquete desde §3.1)
│   ├── ai_service.py        # ChatIA — SOLO instrumentar, no modificar
│   ├── chat_metrics.py      # Métricas de ChatIA
│   ├── image_utils.py       # Optimización de imágenes
│   └── management/commands/ # Custom commands (seed_demo, seed_e2e)
└── notificaciones/          # Email, WhatsApp, SSE
```

### Frontend (`frontend/`)
```
frontend/src/
├── components/              # UI components (descompuestos desde §4.1)
├── hooks/                   # Custom hooks (useChatIA extraído)
├── services/                # API client + error handler
├── context/                 # Context providers
├── config/                  # Constantes de app
├── i18n/                    # Traducciones (ES, PT, EN)
└── test/                    # MSW mocks + setup
```

## Estándares de código

### Python (PEP 8)
- `ruff` como linter/formatter (configurar en editor).
- 4 espacios, imports ordenados (stdlib → third-party → local).
- Type hints en funciones públicas.
- Docstrings en español, formato Google/PEP 257.

### JavaScript/React
- ESLint + Prettier (config via Vite).
- Componentes funcionales con hooks.
- Named exports preferidos.
- i18n keys en español base (`es.json`), traducir PT/EN.

### Git
- Conventional Commits: `feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `test:`, `ci:`.
- Prefijo de sección cuando aplica: `fix(5.3):` (FASE 5 §5.3).
- No commitear cambios de migraciones sin `makemigrations` previo.

## Testing

### Cobertura mínima
| Layer | Mínimo |
|---|---|
| Backend | 60% (CI fail-fast) |
| Frontend | 65% |

### Comandos
```bash
# Backend
python -m pytest --cov=. --cov-report=term-missing
python manage.py check --deploy      # prod-readiness

# Frontend
npm run test
npm run test:coverage
npm run i18n:check                # paridad ES/PT/EN

# E2E
npm run e2e
```

### Escribir tests
- Tests unitarios: en `*.tests/` (backend) o `*.test.jsx` (frontend).
- Tests de caracterización: nombrar `*.characterization.test.jsx` para componentes legacy.
- Mock de APIs externas con MSW (`frontend/test/server.js`).

## Pull Requests

### Checklist antes de enviar
- [ ] Tests pasan (`backend-ci` y `frontend-ci`).
- [ ] Cobertura ≥ mínimo.
- [ ] `npm run lint` / `ruff check` limpio.
- [ ] i18n paridad verificada.
- [ ] No secrets en diff (`python -m detect_secrets audit`).
- [ ] Migraciones incluidas (si modelos cambiaron).
- [ ] `CHANGELOG.md` actualizado.

### Review
- Al menos 1 reviewer técnico.
- Auto-merge disponible para `patch`/`docs`/`ci` si CI pasa.
- Para cambios de seguridad: aprobación de 2 reviewers mínimo.

## CI/CD

Los workflows en `.github/workflows/`:
- `backend-ci.yml`: Python 3.12, Redis, check --deploy, pytest, Codecov.
- `frontend-ci.yml`: Node 20, lint, test, build.
- `e2e.yml`: Playwright en PRs a `main`/`belkis-saude`.

Ver detalles en [CHANGELOG.md](CHANGELOG.md) y el diagrama de arquitectura en [README.md](README.md).
