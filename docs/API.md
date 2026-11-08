# API REST — Endpoints

Todas las rutas están bajo `/api/` (definidas en `backend/core/urls.py`, `backend/usuarios/urls.py` y `backend/notificaciones/urls.py`).

## Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/token/` | Obtener par de tokens JWT (login por usuario/email/teléfono) | No |
| POST | `/api/token/refresh/` | Refrescar access token | No |
| POST | `/api/token/verify/` | Verificar token | No |

## Usuarios

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/registro/` | Registro público de usuario | No (throttle 5/min) |
| GET | `/api/usuario-actual/` | Datos del usuario autenticado | Sí |
| POST | `/api/cambiar-contrasena/` | Cambiar contraseña | Sí |
| GET/PUT/PATCH/DELETE | `/api/usuarios/` | CRUD de usuarios (ViewSet) | Sí |
| POST/DELETE | `/api/foto-perfil/` | Subir/eliminar foto de perfil propio | Sí |
| POST/DELETE | `/api/foto-perfil/<id>/` | Subir/eliminar foto de otro usuario (solo admin) | Sí (admin) |

## Citas

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/citas/` | Listar/crear citas | Sí |
| GET/PUT/PATCH/DELETE | `/api/citas/<id>/` | Detalle/actualizar/eliminar cita | Sí |
| POST | `/api/citas/<id>/cancelar/` | Cancelar cita | Sí |
| POST | `/api/citas/<id>/confirmar/` | Confirmar cita | Sí |
| GET | `/api/mis-citas/` | Citas del usuario actual | Sí |

## Doctores, enfermeras, especialidades, pacientes, horarios

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

## Asistente de citas

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/chat-ia/` | Enviar mensaje al asistente (máquina de estados) | Sí |
| GET | `/api/chat-ia/sugerencias/` | Obtener sugerencias según estado de conversación | Sí |

## Imágenes del sitio promocional

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/sitio-imagenes/` | Listar imágenes (filtros `tipo`, `activo`) | Público (list/retrieve) |
| GET | `/api/sitio-imagenes/carousel/` | Imágenes del carrusel activas | Público |
| GET | `/api/sitio-imagenes/hero/` | Imagen hero activa | Público |
| POST/PUT/PATCH/DELETE | `/api/sitio-imagenes/` | CRUD de imágenes | Sí (auth) |

## Notificaciones

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/notificaciones/` | Listar/crear notificaciones propias | Sí |
| GET/PUT/PATCH/DELETE | `/api/notificaciones/<id>/` | Detalle/actualizar/eliminar notificación | Sí (dueño) |
| POST | `/api/notificaciones/marcar_todas_leidas/` | Marcar todas como leídas | Sí |
| POST | `/api/notificaciones/<id>/marcar_leida/` | Marcar una como leída | Sí |
| GET | `/api/notificaciones/no_leidas/` | Notificaciones no leídas | Sí |
| GET | `/api/notificaciones/ultimas/` | Últimas 10 notificaciones | Sí |
| GET | `/api/notificaciones/stream/?token=JWT` | Stream SSE en tiempo real | Sí |

## Salud del sistema

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/health/` | Health check completo (DB, caché, Redis) | No |
| GET | `/health/db/` | Health check de base de datos | No |

## Autenticación y autorización (JWT)

- Backend configura `REST_FRAMEWORK` con `JWTAuthentication` como primera clase, seguido de `SessionAuthentication` (para navegador) y `BasicAuthentication`.
- Permiso por defecto: `IsAuthenticated`; endpoints públicos (`registro`, sitio-imagenes list/retrieve) se excepcionsan en las vistas.
- `CustomTokenObtainPairSerializer` permite autenticar con `username`, `email` o `telefono`.
- Regla de acceso a citas: pacientes ven solo sus citas; doctores/enfermeras ven las citas donde son el profesional; admin ve todas.
- SSE autentica mediante `AccessToken` pasado por query param (`?token=`) porque `EventSource` no admite cabeceras personalizadas.
