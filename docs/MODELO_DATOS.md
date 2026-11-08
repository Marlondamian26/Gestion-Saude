# Modelo de datos

En desarrollo local se usa **SQLite** (`backend/db.sqlite3`). En producción se usa **PostgreSQL 16 gestionado por Supabase** a través de `DATABASE_URL` con `conn_max_age=600`, `ssl_require=True` y health checks de conexión.

## Modelos principales (`backend/usuarios/models.py`)

### Usuario (extiende `AbstractUser`, `AUTH_USER_MODEL = 'usuarios.Usuario'`)
- `username`, `password`, `first_name`, `last_name`, `email` (unique, nullable), `rol` (`admin`/`doctor`/`nurse`/`patient`, default `patient`), `telefono`, `foto_perfil` (ImageField), `fecha_nacimiento`, `terminos_aceptados`, `fecha_aceptacion_terminos`, `version_terminos_aceptada`.
- Índice en `rol`.

### Especialidad
- `nombre` (unique), `descripcion`, `tipo_especialidad` (`medica`/`enfermeria`/`ambas`), `activo`.

### Doctor (1:1 con Usuario)
- `especialidad` (FK), `otra_especialidad`, `biografia`, `fecha_registro`.

### Enfermera (1:1 con Usuario)
- `especialidad` (FK, nullable), `otra_especialidad`, `numero_licencia`, `biografia`.

### Paciente (1:1 con Usuario)
- `alergias`, `grupo_sanguineo` (A+, A-, …, O-), `contacto_emergencia`, `telefono_emergencia`.

### Horario
- `doctor` (FK), `dia_semana` (0-6), `hora_inicio`, `hora_fin`, `activo`.
- CheckConstraint `hora_fin > hora_inicio`; unique_together (doctor, dia_semana, hora_inicio, hora_fin); índice (doctor, dia_semana, activo).

### Cita
- `paciente` (FK), `doctor` (FK), `fecha`, `hora`, `estado` (`pendiente`/`confirmada`/`completada`/`cancelada`/`no_asistio`, default `pendiente`), `motivo`, `notas_adicionales`, `duracion_minutos` (10-240, default 30), `fecha_creacion`, `fecha_actualizacion`.
- UniqueConstraint para citas activas (doctor, fecha, hora); índices (doctor, fecha, estado) y (paciente, fecha).

### SitioImagen
- `titulo`, `descripcion`, `imagen`, `tipo` (`hero`/`carousel`/`galería`), `orden`, `activo`, `fecha_creacion`.

### Notificacion (`backend/notificaciones/models.py`)
- `usuario` (FK), `tipo`, `titulo`, `mensaje`, `leida`, `estado` (`pendiente`/`enviada`/`fallida`), `intentos`, `content_type`/`object_id` (GenericForeignKey a Cita), `fecha_creacion`, `fecha_envio`.
- Índices (usuario, leida) y (usuario, estado).

## Relaciones clave (ver `docs/er-diagram.md`)

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

## Migraciones relevantes

| Archivo | FASE | Descripción |
|---------|------|-------------|
| 0002_initial_doctor... | FASE 1 | Estructura base |
| 0003_notificacion_intentos | §5.3 | Campo `intentos` para retry email |
| 0004_normalize_email | FASE 1 | Único email |
| 0005_report_admin_superusers | FASE 1 | Reporte, no revoca |

> Todas las migraciones verificadas en CI: `makemigrations --check --dry-run` debe pasar.
