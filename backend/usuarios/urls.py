from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Crear router automático para los ViewSets
router = DefaultRouter()
router.register(r'usuarios', views.UsuarioViewSet)
router.register(r'doctores', views.DoctorViewSet)
router.register(r'enfermeras', views.EnfermeraViewSet)
router.register(r'pacientes', views.PacienteViewSet)
router.register(r'especialidades', views.EspecialidadViewSet)
router.register(r'horarios', views.HorarioViewSet)
router.register(r'citas', views.CitaViewSet)
router.register(r'sitio-imagenes', views.SitioImagenViewSet)

urlpatterns = [
    # Rutas del router (genera automáticamente /api/doctores/, /api/doctores/1/, etc.)
    path('', include(router.urls)),
    
    # Rutas personalizadas
    path('registro/', views.registro_usuario, name='registro'),
    path('usuario-actual/', views.usuario_actual, name='usuario_actual'),
    path('cambiar-contrasena/', views.cambiar_contrasena, name='cambiar_contrasena'),
    
    # Rutas públicas (que todos los usuarios autenticados pueden ver)
    path('especialidades-publicas/', views.especialidades_publicas, name='especialidades_publicas'),
    path('doctores-publicos/', views.doctores_publicos, name='doctores_publicos'),
    path('especialistas-publicos/', views.especialistas_publicos, name='especialistas_publicos'),
    path('mis-citas/', views.mis_citas, name='mis_citas'),
    
    # Rutas de perfil personal para doctores y enfermeras
    path('mi-perfil-doctor/', views.mi_perfil_doctor, name='mi_perfil_doctor'),
    path('mi-perfil-enfermera/', views.mi_perfil_enfermera, name='mi_perfil_enfermera'),
    
    # Rutas del Asistente de IA
    path('chat-ia/', views.chat_ia, name='chat_ia'),
    path('chat-ia/sugerencias/', views.chat_ia_sugerencias, name='chat_ia_sugerencias'),
    
    # Búsqueda de pacientes (para ChatIA y AdminDashboard)
    path('buscar-pacientes/', views.buscar_pacientes, name='buscar_pacientes'),
    
    # Gestión de foto de perfil
    path('foto-perfil/', views.gestionar_foto_perfil, name='gestionar_foto_perfil'),
    path('foto-perfil/<int:usuario_id>/', views.gestionar_foto_perfil, name='gestionar_foto_perfil_usuario'),

    # Recuperación de contraseña (pública)
    path('password-reset/request/', views.password_reset_request, name='password-reset-request'),
    path('password-reset/confirm/', views.password_reset_confirm, name='password-reset-confirm'),
]