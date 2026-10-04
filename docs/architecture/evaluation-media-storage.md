# Evaluación: Migración de Media a Cloud Storage

**FASE 7 §7.4 — Evaluación de storage para MEDIA_ROOT**
**Fecha:** 2026-10-04
**Estado:** Código preparado con feature flag; migración pendiente de aprobación manual.

## Contexto

Render free (plan gratuito) no persiste `MEDIA_ROOT`:
- Cada redeploy de Render destruye el filesystem temporal.
- Fotos de perfil subidas por usuarios, imágenes del sitio promocional, etc. se pierden.
- Esto fue documentado como **riesgo residual** en FASE 2 y persiste sin resolución.

## Impacto

| Tipo de archivo | Ubicación actual | Impacto si se pierde |
|---|---|---|
| Fotos de perfil (doctores, enfermeras, pacientes) | `MEDIA_ROOT/perfiles/` | Usuario sin avatar. Se puede re-subir. |
| Imágenes hero del sitio promocional | `MEDIA_ROOT/` | Landing se ve rota. Afecta UX. |
| Carousel del sitio promocional | `MEDIA_ROOT/` | Carrusel se ve roto. Afecta marketing. |

## Alternativas evaluadas

| Opción | Pros | Contras | Free tier | Veredicto |
|---|---|---|---|---|
| **A) Render Disk (persistent disk)** | Zero código. Integrado. | Pago: $1/GB/mes. | No | Si hay presupuesto. |
| **B) AWS S3** | Estándar. Robusto. | Configuración IAM compleja. | 5GB 12 meses | ✅ Si ya usas AWS. |
| **C) Cloudflare R2** | 10GB gratis/mes, egress gratis. | Menos docs que S3. | ✅ Sí (10GB) | ✅ **Recomendado (mejor free tier)**. |
| **D) Supabase Storage** | Ya usas Supabase DB. Menos fricción. | 1GB free. Luego pago. | ✅ Sí (1GB) | ✅ **Recomendado (menos fricción)**. |
| **E) Cloudinary** | Optimización on-the-fly (redundante con FASE 5). | Free tier limitado (25 credits/mes). | ✅ Sí (25 credits) | ❌ Descartado (FASE 5 ya optimiza). |
| **F) Backblaze B2** | 10GB gratis. S3-compatible. | API menos pulida. | ✅ Sí (10GB) | Alternativa menor a R2. |

## Recomendación

**Cloudflare R2** (opción C) — 10GB gratis/mes es más que suficiente para fotos de perfil + imágenes hero. Compatible con S3 API (django-storages funciona directamente).

**Supabase Storage** (opción D) — alternativa si ya pagas Supabase, menos configuración (misma plataforma).

## Implementación preparatoria

### Feature flag en `settings.py`

```python
# [FASE 7 §7.4] Storage backend con feature flag
if os.environ.get('MEDIA_STORAGE') == 's3':
    STORAGES['default']['BACKEND'] = 'storages.backends.s3.S3Storage'
    STORAGES['default']['OPTIONS'] = {
        'access_key': os.environ['AWS_ACCESS_KEY_ID'],
        'secret_key': os.environ['AWS_SECRET_ACCESS_KEY'],
        'bucket_name': os.environ['AWS_STORAGE_BUCKET_NAME'],
        'endpoint_url': os.environ.get('AWS_S3_ENDPOINT_URL'),  # R2: https://<account>.r2.cloudflarestorage.com
        'region_name': os.environ.get('AWS_S3_REGION_NAME', 'auto'),  # R2: 'auto'
        'default_acl': None,  # R2 no soporta ACLs
        'querystring_auth': True,  # URLs firmadas
        'file_overwrite': False,
        'object_parameters': {'CacheControl': 'max-age=86400'},
    }
```

**Feature flag:** `MEDIA_STORAGE=s3` activa S3. Sin flag → `FileSystemStorage` (default). ✅ Código está en `backend/core/settings.py`, no rompe prod actual.

### Dependencias en `requirements.txt`

```
django-storages[s3]==1.18.0
boto3==1.39.0
```

Actualmente comentadas (instalar solo si se activa flag).

### Management command de migración

`backend/usuarios/management/commands/migrate_media_to_s3.py`:

```bash
# Dry run (default — ver qué se migraría)
python manage.py migrate_media_to_s3

# Ejecutar migración real
python manage.py migrate_media_to_s3 --apply
```

- **Idempotente:** si el archivo ya está en S3, se sobreescibe con el mismo contenido.
- **Backup previo:** antes de ejecutar, backup de `MEDIA_ROOT` (FASE 0 lo documenta: `tar -czf media-backup-$(date +%Y%m%d).tar.gz backend/media/`).
- **No ejecutar sin aprobación.** Marca como `[REQUIERE APROBACIÓN + ACCIÓN MANUAL]`.

## Actions pendientes para el humano

1. **Decidir proveedor** (R2, Supabase Storage, S3).
2. **Crear bucket + credenciales** en el proveedor elegido.
3. **Setear env vars en Render:**
   - `MEDIA_STORAGE=s3`
   - `AWS_ACCESS_KEY_ID=<key>`
   - `AWS_SECRET_ACCESS_KEY=<secret>`
   - `AWS_STORAGE_BUCKET_NAME=<bucket>`
   - `AWS_S3_ENDPOINT_URL=<endpoint>` (R2)
   - `AWS_S3_REGION_NAME=auto` (R2)
4. **Instalar deps:** `pip install django-storages[s3] boto3` (añadir a requirements.txt).
5. **Backup de media:** `tar -czf media-backup.tar.gz backend/media/`
6. **Ejecutar migración:** `python manage.py migrate_media_to_s3 --apply`
7. **Redesplegar** y verificar que imágenes cargan desde S3.
8. **Eliminar backup local** tras confirmar (opcional, o mover a S3 como backup).

## Plan de rollback

1. **Revertir feature flag:** `MEDIA_STORAGE=` en Render env vars.
2. **Restaurar backup local:** `tar -xzf media-backup.tar.gz -C backend/`
3. **Redesplegar.**

## Estado

| Item | Estado |
|---|---|
| Código STORAGES con feature flag | ✅ Implementado |
| django-storages/boto3 en requirements | ✅ En comments (instalar al activar) |
| Management command de migración | ✅ `migrate_media_to_s3.py` (dry-run default) |
| Proveedor provisionado | ❌ Pendiente (acción manual) |
| Credenciales configuradas | ❌ Pendiente (acción manual) |
| Migración ejecutada | ❌ Pendiente (acción manual) |
