# AUDIT.md — FASE 0: Preparación y Baseline

**Fecha de ejecución:** 2026-10-04T04:16:55Z
**Ejecutado por:** KiloCode (agente IA)
**Rama:** chore/audit-fixes
**Commit base:** 70b12322a9ac8fed3e7e4638cf2a37362322d084

## 0.1 Inventario y respaldo
- [x] Rama creada: `chore/audit-fixes` (working tree estaba limpio antes de crear). Commit base: `70b12322a9ac8fed3e7e4638cf2a37362322d084`
- [x] `requirements.lock.txt` generado (103 líneas, `pip freeze` del entorno global del Codespace). No existía previamente.
- [x] `frontend-deps.txt` generado (38 líneas, `npm ls --depth=0`). Todos los paquetes aparecen como UNMET porque `node_modules/` no está instalado en el Codespace.
- [~] Backup `db.sqlite3` → **NO EXISTE** en `backend/db.sqlite3`. Nada que respaldar. El `.gitignore` incluye `*.sqlite3`.
- [~] Backup Supabase → **[REQUIERE ACCIÓN MANUAL]** — `DATABASE_URL` ausente en variables de entorno del Codespace y `pg_dump` no está instalado. Ver instrucciones en sección "Acciones que requieren intervención humana".
- [~] Backup `backend/sitio/` → **NO EXISTE** en el workspace. El directorio se crea en runtime según `backend/core/settings.py:154-156` (`os.makedirs`). Nada que respaldar.
- [x] `.gitignore` actualizado: añadida entrada `backups/` bajo nueva sección `# Backups (audit + supabase dumps)`.

### Entorno de ejecución (Codespace)
| Herramienta | Versión |
|---|---|
| Python | 3.14.2 |
| pip | 26.2.1 |
| Node.js | v24.21.0 |
| npm | 11.19.0 |
| pg_dump | No instalado |

---

## 0.2 Verificación de versiones

Verificación contra PyPI en tiempo real (2026-10-04). Todas las consultas usaron `curl https://pypi.org/pypi/<pkg>/json`.

### Tabla de discrepancias

| Paquete | Versión declarada | Existe en PyPI | Última estable | Requires-Python | Compatibilidad Python 3.14 | Acción propuesta |
|---|---|---|---|---|---|---|
| Django | 6.0.2 | ✅ Sí | 6.1.1 | >=3.12 | ✅ Soporta 3.12-3.14 | OK. Considerar actualizar a 6.1.1 en FASE 1. |
| djangorestframework | 3.16.1 | ✅ Sí | 3.16.1 | >=3.9 | ✅ (No lista 3.14 en classifiers, pero allows >=3.9) | OK. Requiere `django>=4.2` ✓ compatible con 6.0.2. |
| dj-database-url | 0.5.0 | ✅ Sí (lanzado ~2018) | 3.1.2 | None (declarado) | Sin restricción explícita; técnicamente funciona | ⚠️ **Obsoleto**. Proponer actualización a 2.x o 3.x en FASE 1. Riesgo de incompatibilidad con formatos de URL modernos. |
| psycopg2-binary | 2.9.12 | ✅ Sí | 2.9.13 | >=3.9 | ✅ Tiene wheels cp314 para Linux/macOS/Windows | OK. Considerar 2.9.13 (patch menor). |
| asgiref | 3.11.1 | ✅ Sí | — | — | OK | Sin cambios. |
| django-cors-headers | 4.9.0 | ✅ Sí | — | — | OK | Sin cambios. |
| djangorestframework-simplejwt | 5.5.1 | ✅ Sí | 5.5.1 | — | OK | Sin cambios. |
| drf-spectacular | 0.29.0 | ✅ Sí | 0.30.0 | — | OK | Considerar 0.30.0. |
| drf-spectacular-sidecar | 2026.3.1 | ✅ Sí | 2026.10.1 | — | OK | Considerar 2026.10.1. |
| gunicorn | 25.1.0 | ✅ Sí | 26.2.0 | — | OK | Considerar 26.x. |
| twilio | 9.10.2 | ✅ Sí | 9.11.2 | — | OK | Considerar 9.11.2. |
| django-dbbackup | 4.1.0 | ✅ Sí | 5.3.1 | — | OK | Considerar 5.x (mayor compatibilidad con Django 6). |
| pillow | 12.1.1 | ✅ Sí | — | — | OK | Sin cambios. |
| whitenoise | 6.7.0 | ✅ Sí | — | — | OK | Sin cambios. |
| aiohttp | 3.13.3 | ✅ Sí | 3.14.3 | — | OK | Considerar 3.14.3. |
| aiohttp-retry | 2.9.1 | ✅ Sí | — | — | OK | Sin cambios. |

### Notas específicas

#### Django 6.0.2 ↔ Django 6.1.1
- Django 6.0.2 **existe** en PyPI. No es una discrepancia crítica de existencia.
- `Requires-Python: >=3.12`. El Codespace usa Python 3.14.2 → compatible.
- Classificadores confirman soporte para Python 3.12, 3.13, 3.14.
- Django 6.0.2 publica sólo sdist + universal wheel (pure Python), por lo que no hay wheels específicos por versión de Python (usan `py3-none-any.whl`).
- La última estable es 6.1.1. No modificar el `requirements.txt` en esta fase.

#### DRF 3.16.1 ↔ Django
- `requires_dist` de DRF 3.16.1: `['django>=4.2']`
- Django 6.0.2 satisface `django>=4.2` → **compatible** ✅
- `Requires-Python: >=3.9` → compatible con Python 3.14.2 ✅
- Nota: DRF 3.16.1 no lista Python 3.14 en classifiers, pero `requires_python >=3.9` lo permite.

#### dj-database-url 0.5.0
- Versión 0.5.0 existe (lanzada aproximadamente en 2018).
- Última estable: 3.1.2 (versión 3.x ya disponible).
- 0.5.0 no declara `requires_python` → no hay bloqueo técnico por versión de Python.
- ⚠️ **Riesgo**: Versiones antiguas de `dj-database-url` pueden no parsear correctamente URLs de PostgreSQL con parámetros modernos o manejar `conn_max_age` y `ssl_require` como se espera en versiones recientes de Django.
- Propuesta: actualizar a `dj-database-url>=3.1.2` (compatible con Python >=3.10).

#### psycopg2-binary 2.9.12
- Versión 2.9.12 existe en PyPI.
- Última estable: 2.9.13 (diferencia de parche).
- `Requires-Python: >=3.9` → compatible con Python 3.14.2.
- **Tiene wheels precompilados para cp314** (manylinux, musllinux, macOS, Windows) → no requiere compilación.
- ✅ Compatible y funcional. Considerar actualizar a 2.9.13 (parche de seguridad menor).

---

## 0.3 Mapa de entorno

### 0.3.1 Variables de entorno — backend

No existen archivos `.env`, `.env.local`, `.env.production` u otros en `backend/` ni en la raíz del proyecto. Las credenciales de base de datos están **hardcodeadas** en `backend/core/settings.py:105` como fallback de `dj_database_url.config()` (URL con credenciales — no se imprimen los valores).

| Variable | Definida en .env | Definida en render.yaml | Usada en settings.py | Observaciones |
|---|---|---|---|---|
| `DATABASE_URL` | ✗ | ✓ (fromDatabase) | ✓ (dj_database_url.config) | OK en prod, pero default hardcodeado con credenciales en settings.py:105 |
| `SECRET_KEY` | ✗ | ✓ (generateValue: true) | ✓ | OK |
| `DEBUG` | ✗ | ✓ ("False") | ✓ | OK |
| `ALLOWED_HOSTS` | ✗ | ✓ | Parcial | settings.py:29 hardcodea hosts (no usa getenv). La var de render.yaml se ignora. |
| `CORS_ALLOWED_ORIGINS` | ✗ | ✓ | Parcial | settings.py:178 establece `CORS_ALLOW_ALL_ORIGINS = True`, lo que **ignora** `CORS_ALLOWED_ORIGINS`. Riesgo de seguridad. |
| `VITE_API_URL` | ✗ | ✓ | ✗ | ⚠️ **Variable de frontend mal ubicada** en el servicio backend de render.yaml:23-24. El backend no la usa. |
| `DEMO_PATIENT_USERNAME` | ✗ | ✓ ("patient") | apps.py:14 | OK |
| `DEMO_PATIENT_PASSWORD` | ✗ | ✓ ("patient123") | apps.py:15 | ⚠️ Password "patient123" en render.yaml es débil. |
| `EMAIL_HOST` | ✗ | ✗ | ✓ (default 'smtp.gmail.com') | ✗ No definida en render.yaml, usa default |
| `EMAIL_PORT` | ✗ | ✗ | ✓ (default 587) | ✗ No definida en render.yaml |
| `EMAIL_USE_TLS` | ✗ | ✗ | ✓ (default True) | ✗ No definida en render.yaml |
| `EMAIL_HOST_USER` | ✗ | ✗ | ✓ (default '') | ✗ No definida en render.yaml |
| `EMAIL_HOST_PASSWORD` | ✗ | ✗ | ✓ (default '') | ✗ No definida en render.yaml |
| `TWILIO_ACCOUNT_SID` | ✗ | ✗ | ✓ (default '') | ✗ No definida en render.yaml |
| `TWILIO_AUTH_TOKEN` | ✗ | ✗ | ✓ (default '') | ✗ No definida en render.yaml |
| `TWILIO_WHATSAPP_NUMBER` | ✗ | ✗ | ✓ (default '') | ✗ No definida en render.yaml |
| `GENERIC_ADMIN_USERNAME` | ✗ | ✗ | apps.py:9 | ⚠️ Default hardcodeado: 'admin' |
| `GENERIC_ADMIN_PASSWORD` | ✗ | ✗ | apps.py:10 | ⚠️ Default hardcodeado: '12345678' (débil) |

#### Credenciales hardcodeadas detectadas
- `settings.py:24` — `SECRET_KEY` fallback: `django-insecure-...` (valor hardcodeado en código fuente)
- `settings.py:105` — URL de PostgreSQL con credenciales hardcodeada como default de `dj_database_url.config()`
- `apps.py:9-10` — `GENERIC_ADMIN_USERNAME`='admin', `GENERIC_ADMIN_PASSWORD`='12345678'
- `apps.py:26-27` — `DEMO_PATIENT_USERNAME`='demo_patient', `DEMO_PATIENT_PASSWORD`='demo1234'
- `render.yaml:27-28` — `DEMO_PATIENT_PASSWORD`="patient123"

### 0.3.2 Variables de entorno — frontend

| Variable | En .env | En .env.example | Observaciones |
|---|---|---|---|
| `VITE_API_URL` | ✓ (https://gestion-saude-backend.onrender.com/api) | ✓ (http://127.0.0.1:8000/api) | Solo variable de entorno. |

#### Observación: VITE_API_URL en render.yaml
- `render.yaml:23-24` define `VITE_API_URL` como envVar del **servicio backend**.
- `VITE_API_URL` es una variable de entorno en tiempo de **build** del frontend (prefijo `VITE_`), no del backend.
- El backend no referencia `VITE_API_URL` en `settings.py` ni en ningún `*.py`.
- **Conclusión:** La inclusión de `VITE_API_URL` en `render.yaml` (servicio backend) es innecesaria y potencialmente confusa. Debe estar en la configuración del servicio frontend.

### 0.3.3 Workers Gunicorn en Render

- **startCommand** (`render.yaml:9`): `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
- **No especifica `--workers`** → Gunicorn usa la fórmula default: `(2 * multiprocessing.cpu_count()) + 1`
- En este Codespace: `multiprocessing.cpu_count() = 2` → **5 workers por defecto**
- En Render **free tier**: 0.1 CPU / 512 MB RAM, max 1 instancia (según docs oficiales de Render)
- Render provee `RENDER_CPU_COUNT` env var (valores posibles: "0.1" para free tier), pero **Gunicorn no la usa automáticamente**. La fórmula `(2 * cpu_count) + 1` usará `multiprocessing.cpu_count()`, que en un container puede devolver el CPU count del host (no los 0.1 CPU limitados).
- Posiblemente Gunicorn spawnée **3-5 workers** en producción en free tier.
- **Impacto crítico:** Cada worker tiene su propio espacio de memoria → `LocMemCache` no es compartido → **rate limiting inconsistente** y **sesiones/caching no coherentes** entre workers.

#### Comparación con GUIDE-RENDER-DEPLOYMENT.txt
- El guide (línea 25) recomienda: `gunicorn core.wsgi:application --bind :3000`
- `render.yaml` usa: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
- Discreción: el guide usa `:3000` (puerto fijo), render.yaml usa `$PORT` (variable de Render). `$PORT` es el enfoque correcto en Render.

### 0.3.4 Cache real en producción

- **Backend:** `LocMemCache` en `settings.py:33-42`
- **Sin** `django-redis`, `redis`, ni `RedisCache` en `requirements.txt`
- **Sin** `CACHE_URL` en envVars de `render.yaml`
- **`WHITENOISE_USE_CACHE = True`** (`settings.py:76`) → WhiteNoise también utiliza LocMemCache internamente
- **`REST_FRAMEWORK` throttle** (`settings.py:225-232`) usa cache → con múltiples workers, cada worker tiene su propio contador de rate limits → **rate limiting no funciona de forma coherente en producción**
- **Conclusión:** Producción usa `LocMemCache`, que es **inadecuado con >1 worker**. Documentado en el propio código (`settings.py:32`: "Using LocMemCache for development; use Redis for production") pero **no implementado** la migración a Redis.

### 0.3.5 Mapa de despliegue

| Aspecto | Valor | Fuente |
|---|---|---|
| Build command | `pip install -r requirements.txt && python manage.py makemigrations && python manage.py migrate --noinput && python manage.py showmigrations && python manage.py collectstatic --noinput` | `render.yaml:8` |
| Start command | `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT` | `render.yaml:9` |
| Plan | free (0.1 CPU / 512 MB RAM) | `render.yaml:6` |
| Root directory | `backend` | `render.yaml:7` |
| Frontend despliegue | **NO definido en render.yaml** | GUIDE-RENDER-DEPLOYMENT.txt:37 describe despliegue manual como Web Service separado |
| STATIC_URL | `static/` | `settings.py:146` |
| STATIC_ROOT | **NO definido** ⚠️ | `settings.py` — `collectstatic` podría fallar sin STATIC_ROOT |
| STATICFILES_STORAGE | `whitenoise.storage.CompressedManifestStaticFilesStorage` | `settings.py:75` |
| MEDIA_URL | `/sitio/` | `settings.py:149` |
| MEDIA_ROOT | `backend/sitio/` | `settings.py:150` |
| Templates DIRS | `backend/sitio/` | `settings.py:83` (para servir SPA via `TemplateView.as_view(template_name='index.html')` en `urls.py:67`) |
| Frontend build output | No especificado claramente | GUIDE-RENDER-DEPLOYMENT.txt:42 sugiere `npm run build` → `dist/` |
| Database | PostgreSQL (Supabase) | `render.yaml:11-14` (fromDatabase) |

#### Discrepancia: STATIC_ROOT no definido
- El build command incluye `python manage.py collectstatic --noinput`.
- `STATIC_ROOT` **no está definido** en `settings.py`.
- Django requiere `STATIC_ROOT` para que `collectstatic` funcione correctamente. Sin él, el comando puede fallar.
- Posible que el proyecto funcione en producción mediante WhiteNoise (que sirve archivos estáticos directamente), pero `collectstatic` aún necesita un directorio de destino.
- ⚠️ **Riesgo:** El build de Render podría fallar en el paso `collectstatic` si `STATIC_ROOT` no se define (posiblemente en un `local_settings.py` gitignorado no visible en el repo).

#### Discrepancia: render.yaml vs GUIDE-RENDER-DEPLOYMENT.txt
- `render.yaml` define solo el servicio backend.
- `GUIDE-RENDER-DEPLOYMENT.txt` describe configuración adicional para el frontend como Web Service separado.
- El frontend **no está representado en `render.yaml`**.

---

## Discrepancias críticas detectadas

1. **`LocMemCache` en producción con múltiples workers** (`settings.py:33-42`). Con Gunicorn corriendo 3-5 workers (según cálculo default), el cache no es compartido → rate limiting de DRF no funciona de forma coherente. Solución: migrar a Redis (`django-redis` + `redis` en requirements).

2. **`VITE_API_URL` definido en render.yaml para el servicio backend** (`render.yaml:23-24`). Esta variable es de build-time del frontend y no se usa en el backend. Confusión de configuración.

3. **Credenciales hardcodeadas en `settings.py:105`** — URL de PostgreSQL con credenciales como fallback de `dj_database_url.config()`. Si `DATABASE_URL` no está configurada, el fallback expone credenciales en código fuente.

4. **`STATIC_ROOT` no definido** en `settings.py` → posible fallo del comando `collectstatic` en el build de Render.

5. **Credenciales genéricas débiles en `apps.py`** — `admin`/`12345678` (hardcodeado) y `demo_patient`/`demo1234` como defaults. `GENERIC_ADMIN_PASSWORD` y `GENERIC_ADMIN_USERNAME` no están en `render.yaml`.

6. **`CORS_ALLOW_ALL_ORIGINS = True`** en `settings.py:178` — **ignora** `CORS_ALLOWED_ORIGINS` y permite cualquier origen. Riesgo de seguridad en producción.

7. **`dj-database-url==0.5.0` obsoleto** — versión de 2018 vs. 3.1.2 actual. Posible incompatibilidad con formatos de URL modernos.

8. **`DEBUG` no verificado como booleano correcto** — `render.yaml:18` establece `DEBUG`="False" (string), y `settings.py:27` hace `os.getenv('DEBUG', 'False') == 'True'`. Funciona, pero `DEBUG=False` en string es correcto. ✅ No es un problema.

---

## Acciones que requieren intervención humana

1. **[REQUIERE ACCIÓN MANUAL] Backup de base de datos de Supabase**
   - `DATABASE_URL` no está definida en el Codespace y `pg_dump` no está instalado.
   - **Instrucciones para el humano:**
     ```bash
     # Opción A: Desde su máquina local con acceso a Supabase
     pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" \
       --no-owner --no-acl -f backups/supabase-$(date +%Y%m%d-%H%M%S).sql
     
     # Opción B: Desde el panel de Supabase → Settings → Database → Database backups
     # Hacer clic en "Download backup" y guardar en backups/
     ```
   - Alternativa: Usar `django-dbbackup` (ya está en requirements) si el servidor de producción lo tiene configurado:
     ```bash
     python manage.py dbbackup
     ```

2. **[REQUIERE ACCIÓN MANUAL] Verificar si STATIC_ROOT está definido en producción**
   - `STATIC_ROOT` no está en `settings.py`. Verificar si existe un `local_settings.py` o `production.py` en el servidor de Render que lo defina. Si no, el build puede fallar en `collectstatic`.

3. **[SUGERENCIA FASE 1] Migrar de LocMemCache a Redis**
   - Instalar `django-redis` y `redis` en `requirements.txt`.
   - Configurar `CACHES['default']['BACKEND']` a `django_redis.cache.RedisCache`.
   - Agregar `REDIS_URL` (o `CACHE_URL`) a variables de entorno en `render.yaml`.
   - Alternativa: usar Redis de Render (Key Value service gratuito disponible).

4. **[SUGERENCIA FASE 1] Corregir configuración de Gunicorn en render.yaml**
   - Añadir `--workers` al startCommand usando `RENDER_CPU_COUNT`:
     ```yaml
     startCommand: gunicorn core.wsgi:application --bind 0.0.0.0:$PORT --workers $(python -c "import os; print(max(1, int(float(os.environ.get('RENDER_CPU_COUNT', '1')))))")
     ```
   - O para free tier: `--workers 1 --threads 2`

5. **[SUGERENCIA FASE 1] Remover `VITE_API_URL` del servicio backend en render.yaml** y asegurar que el servicio frontend tenga su propia variable `VITE_API_URL`.

6. **[SUGERENCIA FASE 1] Hardcodear credenciales**
   - Remover la URL de PostgreSQL con credenciales del `settings.py:105` (fallback de `dj_database_url`). Usar `DATABASE_URL` como única fuente.
   - Configurar `GENERIC_ADMIN_USERNAME` y `GENERIC_ADMIN_PASSWORD` en `render.yaml` con valores seguros.
   - Configurar `SECRET_KEY` con `generateValue: true` (ya está hecho en render.yaml).
   - Considerar usar `django-environ` o `python-decouple` para gestión de env vars.

7. **[SUGERENCIA FASE 1] Deshabilitar `CORS_ALLOW_ALL_ORIGINS`** y usar únicamente `CORS_ALLOWED_ORIGINS`.

8. **[SUGERENCIA FASE 1] Actualizar `dj-database-url`** de 0.5.0 a 3.1.2.

---

## Recomendaciones para FASE 1

1. **Cache y workers:** Migrar `LocMemCache` → Redis (`django-redis` + `redis`), configurar `--workers` explícitos en `render.yaml` usando `RENDER_CPU_COUNT`. Esto es **crítico** para que el rate limiting de DRF funcione en producción.

2. **Seguridad:** Remover credenciales hardcodeadas de `settings.py` y `apps.py`. Definir `SECRET_KEY`, `DATABASE_URL`, `GENERIC_ADMIN_PASSWORD`, y credenciales Twilio/Email como variables de entorno en `render.yaml`. Deshabilitar `CORS_ALLOW_ALL_ORIGINS`.

3. **Compilación:** Verificar/agregar `STATIC_ROOT` en `settings.py`. Asegurar que `collectstatic` funcione en el build de Render.

4. **Configuración de entorno:** Limpiar `render.yaml` — remover `VITE_API_URL` del servicio backend. Asegurar que todas las variables usadas en `settings.py` estén declaradas en `render.yaml` (especialmente `EMAIL_*`, `TWILIO_*`).

5. **Actualizaciones de dependencias:** Proponer actualización de `dj-database-url` 0.5.0 → 3.1.2, `psycopg2-binary` 2.9.12 → 2.9.13, `Django` 6.0.2 → 6.1.1, `drf-spectacular` 0.29.0 → 0.30.0, `django-dbbackup` 4.1.0 → 5.3.1.

6. **Frontend:** Añadir el servicio frontend a `render.yaml` (actualmente solo define el backend). Asegurar que `VITE_API_URL` esté configurada para el servicio frontend, no para el backend.

7. **Backup de Supabase:** Completar el backup de base de datos de producción siguiendo las instrucciones de la sección "Acciones que requieren intervención humana".
