"""
views package — re-exporta todas las vistas públicas para mantener compatibilidad
con usuarios/urls.py y core/urls.py.

Estructura original (§3.1):
views.py (908 líneas) → vistas/auth.py, usuarios.py, doctores.py, enfermeras.py,
                         pacientes.py, especialidades.py, horarios.py,
                         citas.py, sitio.py, chat.py
"""
from .auth import (
    RegistroAnonThrottle,
    CustomTokenObtainPairView,
    registro_usuario,
    usuario_actual,
    cambiar_contrasena,
    gestionar_foto_perfil,
)
from .usuarios import UsuarioViewSet
from .doctores import DoctorViewSet, doctores_publicos, mi_perfil_doctor
from .enfermeras import EnfermeraViewSet, especialistas_publicos, mi_perfil_enfermera
from .pacientes import PacienteViewSet, buscar_pacientes
from .especialidades import EspecialidadViewSet, especialidades_publicas
from .horarios import HorarioViewSet
from .citas import CitaViewSet, mis_citas
from .sitio import SitioImagenViewSet
from .chat import chat_ia, chat_ia_sugerencias

__all__ = [
    'RegistroAnonThrottle',
    'CustomTokenObtainPairView',
    'registro_usuario',
    'usuario_actual',
    'cambiar_contrasena',
    'gestionar_foto_perfil',
    'UsuarioViewSet',
    'DoctorViewSet',
    'doctores_publicos',
    'mi_perfil_doctor',
    'EnfermeraViewSet',
    'especialistas_publicos',
    'mi_perfil_enfermera',
    'PacienteViewSet',
    'buscar_pacientes',
    'EspecialidadViewSet',
    'especialidades_publicas',
    'HorarioViewSet',
    'CitaViewSet',
    'mis_citas',
    'SitioImagenViewSet',
    'chat_ia',
    'chat_ia_sugerencias',
]
