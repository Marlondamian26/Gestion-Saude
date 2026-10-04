"""
Tests de caracterización (contract tests) para la API de usuarios.

Capturan el comportamiento actual ANTES del refactor de views.py (§3.1).
Estos tests deben pasar tanto antes como después del refactor.
"""
from datetime import date, time, timedelta
from unittest.mock import patch

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Usuario, Doctor, Enfermera, Paciente, Especialidad, Horario, Cita


class TestApiContract(TestCase):
    """
    Tests de caracterización para todos los endpoints de usuarios/urls.py.
    Verifican status codes y shape de JSON para usuarios anónimos y autenticados.
    """

    @classmethod
    def setUpTestData(cls):
        # Crear especialidad base
        cls.especialidad = Especialidad.objects.create(
            nombre='Medicina General',
            tipo_especialidad='medica',
            activo=True,
        )

        # Crear usuarios con roles
        cls.admin = Usuario.objects.create_user(
            username='admin', password='AdminPass123!', rol='admin',
            first_name='Admin', last_name='User', email='admin@test.local'
        )
        cls.doctor_user = Usuario.objects.create_user(
            username='dr_smith', password='DoctorPass123!', rol='doctor',
            first_name='John', last_name='Smith', email='doctor@test.local'
        )
        cls.nurse_user = Usuario.objects.create_user(
            username='nurse_jane', password='NursePass123!', rol='nurse',
            first_name='Jane', last_name='Doe', email='nurse@test.local'
        )
        cls.patient_user = Usuario.objects.create_user(
            username='patient_joe', password='PatientPass123!', rol='patient',
            first_name='Joe', last_name='Bloggs', email='patient@test.local'
        )

        # Crear perfiles asociados
        cls.doctor = Doctor.objects.create(usuario=cls.doctor_user, especialidad=cls.especialidad)
        cls.enfermera = Enfermera.objects.create(usuario=cls.nurse_user, especialidad=cls.especialidad)
        cls.paciente = Paciente.objects.get(usuario=cls.patient_user)

    def setUp(self):
        from django.core.cache import cache
        cache.clear()  # Limpiar throttle state entre tests

        self.anon_client = APIClient()
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin)
        self.doctor_client = APIClient()
        self.doctor_client.force_authenticate(user=self.doctor_user)
        self.nurse_client = APIClient()
        self.nurse_client.force_authenticate(user=self.nurse_user)
        self.patient_client = APIClient()
        self.patient_client.force_authenticate(user=self.patient_user)

    # ===== AUTH ENDPOINTS =====

    def test_registro_anonimo_permite_post(self):
        """registro_usuario: anónimo puede POST."""
        data = {
            'username': 'newuser1',
            'password': 'TestPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'rol': 'patient',
        }
        response = self.anon_client.post('/api/registro/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('access', response.data)

    def test_registro_anonimo_validacion_error(self):
        """registro_usuario: anónimo con datos inválidos → 400."""
        response = self.anon_client.post('/api/registro/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_usuario_actual_anonimo_401(self):
        """usuario_actual: anónimo → 401."""
        response = self.anon_client.get('/api/usuario-actual/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_usuario_actual_auth_200(self):
        """usuario_actual: autenticado → 200 con user data."""
        response = self.admin_client.get('/api/usuario-actual/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)
        self.assertIn('username', response.data)
        self.assertIn('rol', response.data)

    def test_cambiar_contrasena_anonimo_401(self):
        """cambiar_contrasena: anónimo → 401."""
        response = self.anon_client.post('/api/cambiar-contrasena/', {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ===== PUBLICOS ENDPOINTS =====

    def test_especialidades_publicas_anonimo_401(self):
        """especialidades_publicas: anónimo → 401."""
        response = self.anon_client.get('/api/especialidades-publicas/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_especialidades_publicas_auth_200(self):
        """especialidades_publicas: autenticado → 200 con lista."""
        response = self.admin_client.get('/api/especialidades-publicas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_doctores_publicos_anonimo_401(self):
        """doctores_publicos: anónimo → 401."""
        response = self.anon_client.get('/api/doctores-publicos/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_doctores_publicos_auth_200(self):
        """doctores_publicos: autenticado → 200 con lista."""
        response = self.admin_client.get('/api/doctores-publicos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        if response.data:
            self.assertIn('usuario', response.data[0])
            self.assertIn('especialidad_nombre', response.data[0])

    def test_especialistas_publicos_anonimo_401(self):
        """especialistas_publicos: anónimo → 401."""
        response = self.anon_client.get('/api/especialistas-publicos/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_especialistas_publicos_auth_200(self):
        """especialistas_publicos: autenticado → 200 con lista de dicts."""
        response = self.admin_client.get('/api/especialistas-publicos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    # ===== MIS CITAS =====

    def test_mis_citas_anonimo_401(self):
        """mis_citas: anónimo → 401."""
        response = self.anon_client.get('/api/mis-citas/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mis_citas_auth_paciente_200(self):
        """mis_citas: paciente autenticado → 200 con lista."""
        response = self.patient_client.get('/api/mis-citas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    # ===== PERFILES =====

    def test_mi_perfil_doctor_anonimo_401(self):
        """mi_perfil_doctor: anónimo → 401."""
        response = self.anon_client.get('/api/mi-perfil-doctor/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mi_perfil_doctor_doctor_200(self):
        """mi_perfil_doctor: doctor autenticado → 200."""
        response = self.doctor_client.get('/api/mi-perfil-doctor/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)

    def test_mi_perfil_enfermera_anonimo_401(self):
        """mi_perfil_enfermera: anónimo → 401."""
        response = self.anon_client.get('/api/mi-perfil-enfermera/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mi_perfil_enfermera_enfermera_200(self):
        """mi_perfil_enfermera: enfermera autenticada → 200."""
        response = self.nurse_client.get('/api/mi-perfil-enfermera/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('id', response.data)

    # ===== CHAT IA =====

    def test_chat_ia_anonimo_401(self):
        """chat_ia: anónimo → 401."""
        response = self.anon_client.post('/api/chat-ia/', {'mensaje': 'test'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_chat_ia_auth_mensaje_vacio_400(self):
        """chat_ia: mensaje vacío → 400."""
        response = self.patient_client.post('/api/chat-ia/', {'mensaje': ''})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chat_ia_sugerencias_anonimo_401(self):
        """chat_ia_sugerencias: anónimo → 401."""
        response = self.anon_client.get('/api/chat-ia/sugerencias/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_chat_ia_sugerencias_auth_200(self):
        """chat_ia_sugerencias: auth → 200 con dict."""
        response = self.patient_client.get('/api/chat-ia/sugerencias/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('sugerencias', response.data)

    # ===== BUSCAR PACIENTES =====

    def test_buscar_pacientes_anonimo_401(self):
        """buscar_pacientes: anónimo → 401."""
        response = self.anon_client.get('/api/buscar-pacientes/?query=jo')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_buscar_pacientes_query_corta_400(self):
        """buscar_pacientes: query < 2 chars → 400."""
        response = self.admin_client.get('/api/buscar-pacientes/?query=j')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_buscar_pacientes_auth_200(self):
        """buscar_pacientes: query válida → 200 con resultados."""
        response = self.admin_client.get('/api/buscar-pacientes/?query=joe')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('resultados', response.data)

    # ===== FOTO PERFIL =====

    def test_foto_perfil_anonimo_401(self):
        """gestionar_foto_perfil: anónimo → 401."""
        response = self.anon_client.post('/api/foto-perfil/', {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_foto_perfil_auth_sin_imagen_400(self):
        """gestionar_foto_perfil: POST sin foto → 400."""
        response = self.patient_client.post('/api/foto-perfil/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ===== VIEWSETS =====

    def test_viewset_anonimo_401(self):
        """Todos los ViewSets: anónimo → 401."""
        for endpoint in [
            '/api/usuarios/',
            '/api/doctores/',
            '/api/enfermeras/',
            '/api/pacientes/',
            '/api/especialidades/',
            '/api/horarios/',
            '/api/citas/',
        ]:
            response = self.anon_client.get(endpoint)
            self.assertIn(response.status_code, [401, 403],
                          f"Expected 401/403 for {endpoint}, got {response.status_code}")

    def test_viewset_list_auth_200(self):
        """ViewSets list: autenticado → 200 con lista o dict paginado."""
        for endpoint in [
            '/api/usuarios/',
            '/api/doctores/',
            '/api/enfermeras/',
            '/api/pacientes/',
            '/api/especialidades/',
            '/api/horarios/',
        ]:
            response = self.admin_client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_200_OK,
                             f"Expected 200 for {endpoint}, got {response.status_code}: {response.data}")

    def test_viewset_citas_list_auth_200(self):
        """CitaViewSet: admin → 200 with list."""
        response = self.admin_client.get('/api/citas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_sitio_imagenes_list_anonimo_200(self):
        """SitioImagenViewSet list: anónimo → 200 (AllowAny)."""
        response = self.anon_client.get('/api/sitio-imagenes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_sitio_imagenes_create_anonimo_400(self):
        """SitioImagenViewSet create: anónimo → 400 (AllowAny permite, pero validación de datos falla)."""
        response = self.anon_client.post('/api/sitio-imagenes/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ===== CUSTOM TOKEN =====

    def test_custom_token_obtain_con_username(self):
        """CustomTokenObtainPairView: login con username → 200 + tokens."""
        response = self.anon_client.post('/api/token/', {
            'username': 'admin',
            'password': 'AdminPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('refresh', response.data)
        self.assertIn('access', response.data)

    def test_custom_token_obtain_wrong_password_400(self):
        """CustomTokenObtainPairView: credenciales inválidas → 400 (SimpleJWT)."""
        response = self.anon_client.post('/api/token/', {
            'username': 'admin',
            'password': 'wrong',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_custom_token_obtain_login_por_email(self):
        """CustomTokenObtainPairView: login con email funciona (característica implementada)."""
        response = self.anon_client.post('/api/token/', {
            'username': 'admin@test.local',
            'password': 'AdminPass123!',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
