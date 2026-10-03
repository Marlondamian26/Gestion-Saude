# # Despliegue en Render

## Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `https://gestion-saude-backend.onrender.com/` | Sitio principal |
| `https://gestion-saude-backend.onrender.com/health/` | Health check (para UptimeRobot) |
| `https://gestion-saude-backend.onrender.com/admin/` | Panel de administración |
| `https://gestion-saude-backend.onrender.com/api/token/` | Obtener JWT |

## UptimeRobot - Mantener el backend activo

El plan gratuito de Render apaga el servidor después de 15 minutos de inactividad. Para evitar esto:

1. **Crear cuenta en UptimeRobot**:
   - Ve a https://uptimerobot.com y regístrate (plan gratuito)

2. **Agregar nuevo monitor**:
   - Click en "Add New Monitor"
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Backend Belkis
   - **URL (or IP)**: `https://gestion-saude-backend.onrender.com/health/`
   - **Monitoring Interval**: 5 minutes (el mínimo gratuito)
   - **Timeout**: 30 seconds

3. **Guardar**:
   - UptimeRobot hará ping cada 5 minutos
   - Si el backend está dormido, Render lo despertará automáticamente

## Acciones después de hacer cambios

```powershell
# 1. Commit y push
git add .
git commit -m "tu mensaje"
git push origin Gestion-Saude

# 2. Render detectará automáticamente los cambios en GitHub
#    y redesplegará el backend
```

---

# # Rutas de la aplicacion
#
# | Ruta | Descripcion |
# |------|-------------|
# | / | Sitio promocional (pagina principal por defecto) |
# | /login | Pagina de inicio de sesion |
# | /registro | Pagina de registro de pacientes |
# | /dashboard | Panel del paciente |
# | /admin | Panel de administracion |
# | /enfermeria | Panel de enfermeria |
# | /citas | Gestion de citas |
# | /doctores | Lista de doctores |
# | /perfil | Perfil del usuario |
#
# ---
# # Guía de mantenimiento y reinicio 🧹
#
# Este archivo concentra un conjunto de comandos útiles para administrar el proyecto Django y, en particular, para **vaciar la base de datos y volver a partir de cero mientras se conserva al superusuario principal**.
#
# ---
# ## 1. Preparar el entorno
# 0.  ```powershell
#      python -m venv venv    <----- para crear el entorno virtual en caso de no existir.
# 1. Activa el virtualenv (Windows PowerShell):
#    ```powershell
#    .\venv\Scripts\Activate.ps1   # o .\venv\Scripts\activate
#    ```
# 2. Para salir del entorno:
#    ```powershell
#    deactivate
#    ```
# 3. Comprueba el servidor/ frontend:
#    ```powershell
#    python manage.py runserver     # iniciar backend
#    Control+C                       # detenerlo
#    npm run dev                    # arrancar frontend desde `frontend/`
#    ```
#
# ---
# ## 2. Copias de seguridad opcionales
#
# > Antes de hacer cambios drásticos puedes copiar las migraciones:
#
# ```powershell
# Copy-Item -Recurse .\usuarios\migrations .\usuarios\migrations_backup
# Copy-Item -Recurse .\notificaciones\migrations .\notificaciones\migrations_backup
# ``` 
#
# ---
# ## 3. Reiniciar la base de datos (borrar todo el contenido)
#
# Los siguientes pasos se ejecutan desde la carpeta `backend` con el entorno activado:
#
# ```powershell
# cd C:\Users\Marlon Damián\Belkis-saude\backend
#
# # 1. elimina el fichero sqlite
# Remove-Item .\db.sqlite3 -ErrorAction SilentlyContinue
#
# # 2. borra las migraciones generadas de las apps (conservando __init__.py)
# Remove-Item .\usuarios\migrations\*.py -Exclude __init__.py -ErrorAction SilentlyContinue
# Remove-Item .\notificaciones\migrations\*.py -Exclude __init__.py -ErrorAction SilentlyContinue
# # (añade otras apps aquí si las tienes)
#
# # 3. asegúrate de que los paquetes de migración existen
# New-Item -Path .\usuarios\migrations\__init__.py -ItemType File -Force
# New-Item -Path .\notificaciones\migrations\__init__.py -ItemType File -Force
#
# # 4. crea las migraciones desde cero
# python manage.py makemigrations usuarios notificaciones
# # repetir para cualquier otra app
#
# # 5. aplica todas las migraciones
# python manage.py migrate
# ```
#
# > Tras estos pasos la base de datos estará completamente limpia, sólo con las tablas vacías.
#
# ---
# ## 4. Superusuario
#
# Para conservar a la misma administradora (`belkis_admin`), crea el superusuario si no existe:
#
# ```powershell
# python manage.py shell -c "from django.contrib.auth import get_user_model; User=get_user_model();
# if not User.objects.filter(username='belkis_admin').exists():
#     User.objects.create_superuser('belkis_admin', 'belkis@example.com', 'admin123')
# print('superuser ok')"
# ```
#
# O bien, usa el comando interactivo habitual:
#
# ```powershell
# python manage.py createsuperuser
# # username: belkis_admin
# # password: admin123
# ```
#
# ---
# ## 5. Comprobaciones y tareas recurrentes
#
# - Verificar la integridad del proyecto:
#   ```powershell
#   python manage.py check
#   ```
#
# - ¿Está el superusuario presente?
#   ```powershell
#   python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model();
#print(U.objects.filter(username='belkis_admin',is_superuser=True).exists())"
#   ```
#
# - Crear migraciones cuando modifiques modelos:
#   ```powershell
#   python manage.py makemigrations
#   python manage.py migrate
#   ```
#
# - Ver rol de un usuario o modificarlo desde shell utilizando el modelo `usuarios.models.Usuario`.
#
# ---
# ## 6. Restauración completa (si cambia de equipo)
#
# Si vuelves a clonar el repositorio desde cero:
#
# ```powershell
# git clone <url>
# cd belkis-saude
# python -m venv venv
# .\venv\Scripts\activate
# pip install -r requirements.txt
# cd backend
# python manage.py migrate
# ```
#
# ¡tendrás un entorno idéntico al anterior!
#
# ---
# ## 7. Tips adicionales
#
# - Actualiza `requirements.txt` con `pip freeze > requirements.txt` tras instalar nuevas librerías.
# - El archivo `Notas` se puede referir cada vez que necesites reiniciar la base o revisar comandos comunes.
#
# ---
#
# ¡Listo! Mantén a mano esta guía y edítala según evolucione el proyecto.
#
# NOTA EXTRA:
# - Si se elimina el último superusuario (incluido el genérico `admin`),
#   al reiniciar el servidor Django se generará automáticamente un usuario
#   llamado `admin` con contraseña `12345678`.
# - Cuando se cree cualquier usuario con `rol='admin'` mediante la API o el
#   panel, el usuario genérico será borrado de inmediato.
#   Esto evita que quede activo más de un administrador genérico en la plataforma.
# - Para comprobar este comportamiento puedes ejecutar el script
#   `test_generic_admin.py` desde la raíz del proyecto; elimina usuarios y
#   simula varios escenarios.
#   Nota: los archivos de prueba se han movido a la carpeta `tests/`.
#   Esta carpeta contiene:
#     * `test_platform_full.py` – suite E2E completa
#     * `test_generic_admin.py` – verificación del admin genérico
#     * helpers/ – utilidades (`clean_test_users.py`, `create_test_admin.py`)
#   Otros scripts antiguos fueron eliminados para mantener el proyecto limpio.

---

# AUDITORÍA DEL CHATBOT DE CITAS MÉDICAS (ChatIA)

## 1. INTENTS Y ENTIDADES IDENTIFICADOS

### 1.1 Intents Principales

| Intent | Descripción | Estado | Prioridad |
|--------|-------------|--------|----------|
| agendar | Iniciar proceso de agendamiento | ✅ Implementado | Alta |
| mis_citas | Ver citas programadas del paciente | ✅ Implementado | Alta |
| cancelar_cita | Cancelar una cita existente | ✅ Implementado | Media |
| posponer | Reprogramar una cita existente | ✅ Implementado | Media |
| ayuda | Obtener ayuda general | ✅ Implementado | Baja |
| confirmar | Confirmar agendamiento | ✅ Implementado | Alta |
| volver | Volver al menú principal | ⚠️ Parcial | Baja |

### 1.2 Intents de Flujo (Estados)

| Intent/Estado | Descripción | Dispara Acción |
|--------------|-------------|----------------|
| elegir_especialidad | Usuario selecciona especialidad | Cargar doctores disponibles |
| elegir_doctor | Usuario selecciona doctor | Solicitar fecha |
| elegir_fecha | Usuario selecciona fecha (hoy/manañana/otra) | Procesar según opción |
| elegir_mes | Usuario selecciona mes (otra fecha) | Generar días del mes |
| elegir_dia | Usuario selecciona día | Cargar horarios |
| elegir_hora | Usuario selecciona hora | Mostrar resumen |
| esperando_fecha | Usuario ingresa fecha manual | Validar y cargar horarios |
| elegir_cita_cancelar | Usuario elige cita a cancelar | Solicitar confirmación |
| elegir_cita_posponer | Usuario elige cita a reprogramar | Solicitar nueva fecha |
| elegir_nueva_fecha | Usuario selecciona nueva fecha | Cargar horarios |
| elegir_nueva_hora | Usuario selecciona nueva hora | Mostrar resumen |
| confirmar_cancelacion | Usuario confirma cancelación | Ejecutar cancelación |
| confirmar_posposicion | Usuario confirma reprogramación | Ejecutar reprogramación |
| confirmar | Usuario confirma agendamiento | Crear cita |

### 1.3 Entidades

| Entidad | Tipo | Validación | Notas |
|--------|------|-----------|-------|
| especialidad | Objeto {id, nombre} | Requerida, debe existir | Se filtra doctores por ID o nombre |
| doctor | Objeto {id, usuario, especialidad_nombre} | Requerido, debe existir | Se necesita ID para cargar horarios |
| fecha | String (YYYY-MM-DD) | Validador de fecha | Debe ser >= hoy, <= 6 meses |
| hora | String (HH:MM) | Formato HH:MM | Debe estar en horarios disponibles |
| mes | String (YYYY-MM) | Formato YYYY-MM | Próximos 6 meses desde actual |
| dia | String (YYYY-MM-DD) | Formato YYYY-MM-DD | Según mes seleccionado |

### 1.4 Datos del Modelo de Cita

```typescript
interface Cita {
  id: number;
  doctor: number;           // FK a Usuario (doctor)
  fecha: string;             // YYYY-MM-DD
  hora: string;             // HH:MM
  motivo: string;            // Opcional
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_asistio';
  paciente: number;          // FK a Usuario (paciente actual)
  created_at: datetime;
  updated_at: datetime;
}
```

---

## 2. DIAGRAMA DE FLUJO PRINCIPAL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INICIO DEL CHATBOT                           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MENÚ PRINCIPAL (estado: inicio)                    │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │
│  │ 1. Agendar     │  │ 2. Mis Citas    │  │ 3. Cancelar    │      │
│  │ cita médica    │  │ (mis_citas)    │  │ cita           │      │
│  └────────────────┘  └────────────────┘  └────────────────┘      │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐                            │
│  │ 4. Posponer    │  │ 5. Necesito    │                            │
│  │ cita           │  │ ayuda          │                            │
│  └────────────────┘  └────────────────┘                            │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────���───┐
         │                     │                     │
         ▼                     ▼                     ▼
┌───────────────┐    ┌──────────────────┐   ┌──────────────┐
│ FLUJO AGENDAR │    │ FLUJO MIS CITAS    │   │ FLUJO AYUDA  │
│ (agendar)    │    │ (mis_citas)       │   │ (ayuda)      │
└───────┬───────┘    └────────┬─────────┘   └──────┬───────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌──────────────────┐   ┌──────────────┐
│ Elegir       │    │ Mostrar lista    │   │ Opciones    │
│ Especialidad │    │ de citas         │   │ de ayuda    │
└───────┬───────┘    │ (fecha/hora/    │   └──────────────┘
        │          │  doctor/estado)  │
        │          └──────────────────┘
        ▼
┌───────────────┐
│ Elegir       │
│ Doctor      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Elegir      │
│ Fecha      │
│(hoy/manana/ │
│ otra)     │
└───────┬───────┘
        │
        ├──────────────┬──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐  ┌──────────────┐
   │  HOY    │   │ MAÑANA  │  │ OTRA FECHA  │
   └────┬────┘   └────┬────┘  └──────┬───────┘
        │            │               │
        └────────────┴───────┬──────┘
                             │
                             ▼
                  ┌─────────────────┐
                  │ Elegir Mes      │
                  │ (próximos 6)    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Elegir Día      │
                  │ (días válidos)  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Cargar         │
                  │ Horarios       │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Elegir Hora    │
                  │ (disponibles)  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Resumen y      │
                  │ Confirmar     │
                  └────────┬────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
        ┌──────────┐            ┌──────────┐
        │ CONFIRMAR│            │ CANCELAR │
        │ (crear) │            │ (volver) │
        └────┬────┘            └────┬─────┘
             │                       │
             ▼                     ▼
        ┌─────────┐          ┌──────────┐
        │ CITA    │          │ MENÚ    │
        │ CREADA │          │ INICIO  │
        └─────────┘          └─────────┘
```

---

## 3. REGLAS DE NEGOCIO

### 3.1 Configuración de Citas

| Regla | Valor | Validación |
|-------|-------|------------|
| Duración de cita | 30 minutos | Fija |
| Horario atención mañana | 08:00 - 12:00 | Configurable por doctor |
| Horario atención tarde | 14:00 - 18:00 | Configurable por doctor |
|/antario atención noche | 18:00 - 20:00 | Opcional |
| Antelación mínima | Día actual | No permite citas pasadas |
| Antelación máxima | 6 meses | Desde fecha actual |
| Estados de cita | pendiente, confirmada, completada, cancelada, no_asistio | Enum |

### 3.2 Reglas de Negocio por Flujo

| Flujo | Regla | Acción si Incumple |
|-------|-------|-------------------|
| Agendar | Doctor debe tener horarios configurados | Mostrar "no hay horarios disponibles" |
| Agendar | Fecha no puede ser en pasado | Validar contra new Date() |
| Agendar | Hora no puede estar ocupada | Verificar contra citas existentes |
| Cancelar | Solo citas pendientes/confirmadas | Mostrar "no hay citas para cancelar" |
| Posponer | Solo citas pendientes/confirmadas | Mostrar "no hay citas para posponer" |
| Posponer | Nueva fecha >= hoy | Validar fecha mínima |

### 3.3 Matriz de Compatibilidad Flujo-Reglas

| Flujo | Especialidad | Doctor | Fecha | Hora | Motivo | Horario |
|------|--------------|--------|-------|------|-------|---------|
| Agendar nuevo | ✅ | ✅ | ✅ | ✅ | Opcional | ✅ |
| Cancelar | N/A | N/A | N/A | N/A | N/A | N/A |
| Posponer | ❌ | ❌ | ✅ | ✅ | N/A | ✅ |
| Ver Mis Citas | N/A | N/A | N/A | N/A | N/A | N/A |

---

## 4. VALIDACIÓN DE DATOS

### 4.1 Campos Validados

| Campo | Tipo | Requerido | Formato | Rangos |
|-------|------|----------|---------|--------|
| especialidad_id | number | Sí | Entero | > 0, existe |
| doctor_id | number | Sí | Entero | > 0, existe |
| fecha | string | Sí | YYYY-MM-DD | >= hoy, <= max(6 meses) |
| hora | string | Sí | HH:MM | En horarios disponibles |
| motivo | string | No | Texto libre | Max 500 caracteres |

### 4.2 Validadores de Fecha

```javascript
// Validar fecha futura
const esFechaFutura = (fecha) => {
  const fechaObj = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fechaObj >= hoy;
};

// Validar dentro de 6 meses
const esFechaValida = (fecha) => {
  const fechaObj = new Date(fecha);
  const hoy = new Date();
  const maxFecha = new Date();
  maxFecha.setMonth(maxFecha.getMonth() + 6);
  return fechaObj >= hoy && fechaObj <= maxFecha;
};

// Validar formato
const esFormatoFechaValido = (fecha) => {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
         /^\d{1,2}-\d{1,2}-\d{4}$/.test(fecha);
};
```

---

## 5. FLUJO DE EXCEPCIONES Y RECUPERACIÓN

### 5.1 Escenarios de Error

| Escenario | Causa | Respuesta | Recuperación |
|-----------|-------|-----------|---------------|
| Sin especialidades | API returns [] | "No hay especialidades disponibles" | Volver a menú |
| Sin doctores para especialidad | Filter returns [] | "No hay doctores de [especialidad]" | Volver a seleccionar |
| Sin horarios disponibles | slots[] empty | "No hay horarios disponibles" | Volver a fecha |
| Fecha inválida | Formato incorrecto | "Formato inválido, use YYYY-MM-DD" | Pedir fecha de nuevo |
| Error API | 4xx/5xx | "Error al conectar con el servidor" | Intentar de nuevo |
| Sesión expirada | 401 | "Sesión expirada" | Redirect a login |

### 5.2 Manejo de Ambigüedades

| Caso | Estrategia | Ejemplo |
|------|------------|--------|
| Especialidad escrita parcialmente | Fuzzy match por nombre | "cardio" → "Cardiología" |
| Doctor escrito parcialmente | Fuzzy match por nombre | "Dr. Juan" → "Dr. Juan Pérez" |
| Fecha ambiguas | Prompt clarificador | "5" → "¿5 de mayo o 5 de junio?" |
| Hora mal escrita | Suggestions | "las 10" → "Selecciona: 10:00, 10:30" |

---

## 6. CASOS DE PRUEBA

### 6.1 Pruebas de Flujo Principal (Happy Path)

| ID | Caso | Entrada | Salida Esperada |
|----|------|--------|---------------|
| TC-001 | Agendar cita-hoy | Especialidad → Doctor → Hoy → Hora → Confirmar | "Cita confirmada" |
| TC-002 | Agendar cita-manana | Especialidad → Doctor → Mañana → Hora → Confirmar | "Cita confirmada" |
| TC-003 | Agendar cita-otra fecha | Especialidad → Doctor → Otra → Mes → Día → Hora → Confirmar | "Cita confirmada" |
| TC-004 | Ver mis citas | Mis Citas | Lista de citas o "No tienes citas" |
| TC-005 | Cancelar cita | Cancelar → Seleccionar → Confirmar (sí) | "Cita cancelada" |
| TC-006 | Posponer cita | Posponer → Seleccionar → Nueva fecha → Nueva hora → Confirmar | "Cita pospuesta" |

### 6.2 Pruebas de Validación

| ID | Caso | Entrada | Salida Esperada |
|----|------|--------|---------------|
| TC-010 | Fecha pasada | "2020-01-01" en manual | "Fecha inválida" |
| TC-011 | Doctor sin horarios | Doctor sin config | "No hay horarios" |
| TC-012 | Hora ocupada | Hora ya tomada | "Horario no disponible" |
| TC-013 | Formato fecha inválido | "manana" en vez de "2026-04-17" | "Formato inválido" |
| TC-014 | Cancelar cita inexistente | Sin citas pendientes | "No hay citas para cancelar" |

### 6.3 Pruebas de Robustez

| ID | Caso | Entrada | Salida Esperada |
|----|------|--------|---------------|
| TC-020 | API no responde | Simular timeout | "Error de conexión" con retry |
| TC-021 | Sesión expirada | 401 de API | "Sesión expirada" → login |
| TC-022 | Special chars |输入 "<script>" | Sanitizar o error |
| TC-023 | Very long input | 1000+ caracteres | Truncar con warning |
| TC-024 | Multiple rapid clicks | Doble click en opción | Debounce/ignorar duplicado |

### 6.4 Pruebas de Localización

| ID | Caso | Entrada | Salida Esperada |
|----|------|--------|---------------|
| TC-030 | Cambio idioma PT→ES | Cambiar a ES | Traducciones en ES |
| TC-031 | Formato fecha ES | "17-04-2026" | Convertir a YYYY-MM-DD |
| TC-032 | Nombres localized | Specialty "Cardiologia" | Match con variaciones |

---

## 7. EJEMPLOS DE INTERACCIÓN

### 7.1 Flujo: Agendar Nueva Cita (Happy Path)

```
Bot: ¿Qué especialidad necesitas?
User: Cardiología

Bot: ¿Con qué doctor quieres la consulta?
  [Dr. Juan Pérez - Cardiología]
  [Dr. María García - Cardiología]

User: Dr. Juan Pérez

Bot: ¿Qué fecha te conviene?
  [Hoy]
  [Mañana]
  [Otra fecha]

User: Mañana

Bot: Selecciona un horario:
  [08:00] [08:30] [09:00]...

User: 09:30

Bot: Resumen de tu cita:
  Doctor: Dr. Juan Pérez
  Fecha: 2026-04-17
  Hora: 09:30
  ¿Confirmas esta cita?

User: Sí

Bot: ¡Cita confirmada exitosamente!
    Tu cita con Dr. Juan Pérez el 17-04-2026 a las 09:30 ha sido agendada.
```

### 7.2 Flujo: Agenda con "Otra Fecha"

```
Bot: ¿Qué fecha te conviene?
  [Hoy] [Mañana] [Otra fecha]

User: Otra fecha

Bot: Selecciona el mes:
  [Abril-2026] [Mayo-2026] [Junio-2026]
  [Julio-2026] [Agosto-2026] [Septiembre-2026]

User: Mayo-2026

Bot: Selecciona el día:
  [1] [2] [3] ... [31]

User: 15

Bot: Selecciona un horario:
  [08:00] [08:30] ...

User: 10:00

Bot: Resumen de tu cita...
```

### 7.3 Flujo: Cancelar Cita

```
Bot: ¿En qué puedo ayudarte?
  [Agendar cita médica] [Mis Citas] [Cancelar una cita] ...

User: Cancelar una cita

Bot: Selecciona la cita que deseas cancelar:
  [17-04-2026 - 09:30 con Dr. Juan Pérez]
  [20-04-2026 - 10:00 con Dra. María García]

User: 17-04-2026 - 09:30

Bot: ¿Estás seguro de cancelar esta cita?
  [Sí] [No]

User: Sí

Bot: Tu cita ha sido cancelada exitosamente.
```

---

## 8. PRIORIZACIÓN DE HALLAZGOS

### 8.1 Hallazgos Críticos (Alineación Inmediata)

| # | Hallazgo | Severidad | Impacto | Recomendación |
|---|---------|-----------|---------|----------------|
| C-01 | Error al crear cita - muestra mensaje de error en vez de éxito | Alta | ✅ Ya corregido en última iteración |
| C-02 | Sin validación de sesión en API calls | Alta | Agregar interceptor para 401 → redirect login |
| C-03 | Timezone no considerado en horarios | Media | Normalizar a zona horaria local (AGO/AT) |

### 8.2 Hallazgos Medios (Próximas 2 Sprints)

| # | Hallazgo | Severidad | Impacto | Recomendación |
|---|---------|-----------|---------|----------------|
| M-01 | No hay integración con calendario externo | Media | Considerar Google Calendar/Outlook |
| M-02 | No hay recordatorios (email/push) | Media | Implementar sistema de notificaciones |
| M-03 | No hay opción de pago en línea | Baja | Integrar pasarela de pago |
| M-04 | Motivación no guardada en agendar | Baja | Agregar campo opcional |

### 8.3 Hallazgos Menores (Backlog)

| # | Hallazgo | Severidad | Impacto | Recomendación |
|---|---------|-----------|---------|----------------|
| L-01 | Chat no accesible por teclado | Baja | Agregar atajos y aria-labels |
| L-02 | No hay dark mode en chat | Baja | Estilos CSS dark-ready |
| L-03 | Sin opción devolver atrás en submenús | Baja | Agregar botón "Volver" |

---

## 9. CONDICIONES LÍMITE Y RESULTADOS ESPERADOS

### 9.1 Límites de Sistema

| Condición | Límite | Comportamiento |
|-----------|--------|----------------|
| Citas por día/doctor | Max 16 (2 slots/hora × 8 horas) | Mostrar "doctor ocupado" |
| Citas futuras por paciente | 5 activas máximo | Warning "límite alcanzado" |
| Días visibles "otra fecha" | 6 meses (+180 días) | No mostrar opción si > límite |
| Intentos de reconexión | 3 | Mostrar error después de 3 fallos |
| Timeout de API | 30 segundos | Mostrar timeout message |

### 9.2 Resultados Esperados por Código HTTP

| Código | Significado | Acción del Bot |
|--------|------------|----------------|
| 200-201 | Success | Mostrar confirmación |
| 400 | Bad request | Mostrar error formateado |
| 401 | Unauthorized | Redirect login |
| 403 | Forbidden | "Sin acceso" message |
| 404 | Not found | "Recurso no encontrado" |
| 409 | Conflict (cita ocupada) | "Horario ocupado, elige otro" |
| 429 | Too many requests | "Intenta más tarde" |
| 500 | Server error | "Error del servidor" |

---

## 10. SEGURIDAD Y PRIVACIDAD

### 10.1 Checklist de Seguridad

| Item | Estado | Notas |
|------|--------|-------|
| Consentimiento explícito | ✅ Requerido | No almacenar sin consentimiento |
| Cifrado en tránsito (HTTPS) | ✅ | Configurado en servidor |
| Sanitización de inputs | ✅ Parcial | Necesita mejora |
| Rate limiting | ⚠️ Pendiente | Implementar en backend |
| Logs sin PHI | ⚠️ Parcial | No guardar datos médicos en logs |
| Sesiones seguras | ✅ | JWT con httpOnly cookie |
| CSRF protection | ✅ | Django CSRF middleware |
| XSS protection | ✅ | React escapa por defecto |

### 10.2 Datos Sensibles en Chat

- **NO almacenar**: N.º Seguro Social, N.º Tarjeta crédito, Contraseñas
- **Almacenar solo si necesario**: Historia médica, Diagnósticos
- **Permitido**: Nombre, Email, Teléfono, Citas (datos de sesión)

---

## 11. ACCESIBILIDAD Y LOCALIZACIÓN

### 11.1 Checklist de Accesibilidad

| Item | Estado | Acción |
|------|--------|--------|
| Contraste suficiente | ⚠️ Revisar |WCAG AA |
| Atajos de teclado | ⚠️ Pendiente | Implementar |
| Screen reader compatible | ✅ Parcial | aria-live regions |
| Focus visible | ✅ | Estilos de focus |
| Text resize | ✅ | Unidades em/rem |
| No solo color | ✅ | Iconos + texto |

### 11.2 Idiomas Soportados

| Idioma | Código | Completitud |
|--------|--------|-------------|
| Portugués | pt | ✅ 100% |
| Español | es | ✅ 100% |
| Inglés | en | ✅ 100% |

---

## 12. RESUMEN EJECUTIVO

### 12.1 Estado Actual

- **Flujos implementados**: Agendar, Cancelar, Posponer, Ver Citas, Ayuda
- **Intents principales**: 6 implementados
- **Validación**: Parcial (falta timezone y rate limiting)
- **Excepciones**: Manejo parcial
- **Integraciones**: Ninguna externa

### 12.2 Recomendaciones de Prioridad

1. **Corto plazo**: Fix de timezone, validación de sesión
2. **Medio plazo**: Recordatorios, integración calendario
3. **Largo plazo**:	Pago en línea, app móvil

### 12.3 Métricas a Monitorear

- Tasa de completación de citas (> 85%)
- Tasa de errores (< 5%)
- Tiempo promedio de agendamiento (< 3 minutos)
- Engagement (citas por usuario/mes)

