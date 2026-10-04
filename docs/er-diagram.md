# Diagrama Entidad-Relación (ER)

Documento de referencia para la estructura de la base de datos (FASE 6 §6.5).

## Diagrama (Mermaid)

```mermaid
erDiagram
    USUARIO {
        string id PK
        string username
        string email UNIQUE
        string first_name
        string last_name
        string rol
        boolean is_superuser
        datetime date_joined
    }
    DOCTOR {
        int id PK
        string usuario_id FK
        int especialidad_id FK
    }
    ENFERMERA {
        int id PK
        string usuario_id FK
    }
    PACIENTE {
        int id PK
        string usuario_id FK
        date fecha_nacimiento
    }
    ESPECIALIDAD {
        int id PK
        string nombre
        string tipo_especialidad
    }
    HORARIO {
        int id PK
        int doctor_id FK
        int dia_semana
        time hora_inicio
        time hora_fin
        boolean activo
    }
    CITA {
        int id PK
        int doctor_id FK
        int paciente_id FK
        datetime fecha_hora
        int duracion_minutos
        string estado
        datetime creada_en
        datetime actualizada_en
    }
    NOTIFICACION {
        int id PK
        string usuario_id FK
        string tipo
        text mensaje
        string cita_id FK NULL
        boolean leida
        datetime creada_en
    }

    USUARIO ||--o{ DOCTOR : "related to"
    USUARIO ||--o{ ENFERMERA : "related to"
    USUARIO ||--o{ PACIENTE : "related to"
    USUARIO ||--o{ NOTIFICACION : "recibe"
    ESPECIALIDAD ||--o{ DOCTOR : "especializa"
    DOCTOR ||--o{ HORARIO : "trabaja bajo"
    DOCTOR ||--o{ CITA : "atiende"
    PACIENTE ||--o{ CITA : "agenda"
    DOCTOR ||--o{ HORARIO : "tiene"
    CITA ||--o{ NOTIFICACION : "genera"
```

## Descripción de entidades

### Usuario
- **email**: campo `unique=True` (FASE 1 auditoría → migración 0004_normalize_email.py).
- **rol**: `'admin' | 'doctor' | 'nurse' | 'patient'`.
- `is_superuser` se monitorea pero no se revoca automáticamente (FASE 1, migración 0005).

### Doctor
- Relación 1:1 con Usuario.
- Cada doctor pertenece a una Especialidad.

### Paciente
- Relación 1:1 con Usuario.
- `fecha_nacimiento` para cálculo de edad.

### Enfermera
- Relación 1:1 con Usuario.

### Especialidad
- `tipo_especialidad`: `'medica' | 'quirurgica' | 'diagnostico'` (choices).

### Horario
- Día de la semana como entero: 0=Lunes, ..., 6=Domingo.
- **CheckConstraint**: `hora_inicio < hora_fin` (FASE 1, Django 6.0 usa `condition=`).
- Unique together: (doctor, dia_semana, hora_inicio, hora_fin).

### Cita
- `duracion_minutos`: entero (default 30), validado en `clean()` para no solapar horarios.
- `estado`: `'confirmada' | 'cancelada' | 'completada' | 'pospuesta'`.

### Notificacion
- Opcionalmente enlazada a una Cita (`cita_id` nullable).
- Campo `leida` booleano, default False.

## Relaciones clave

| Relación | Tipo | Notas |
|---|---|---|
| Usuario → Doctor | 1:1 | Cascade delete |
| Usuario → Paciente | 1:1 | Cascade delete |
| Doctor → Especialidad | N:1 | FK, cascade |
| Doctor → Horario | 1:N | Unique on (doctor, dia_semana, hora_inicio, hora_fin) |
| Cita → Doctor | N:1 | FK |
| Cita → Paciente | N:1 | FK |
| Notificacion → Usuario | N:1 | FK |
| Notificacion → Cita | N:1 | FK, nullable |

## Migraciones relevantes

| Archivo | FASE | Descripción |
|---|---|---|
| 0002_initial_doctor... | FASE 1 | Estructura base |
| 0003_notificacion_intentos | §5.3 | Campo `intentos` para retry email |
| 0004_normalize_email | FASE 1 | Único email |
| 0005_report_admin_superusers | FASE 1 | Reporte, no revoca |

> Todas las migraciones verificadas en CI: `makemigrations --check --dry-run` debe pasar.
