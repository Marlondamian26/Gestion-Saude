from django.test import TestCase
from rest_framework.test import APIClient

from usuarios.models import Paciente, Usuario


class TestPacienteQueryset(TestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            username='admin-patient-query',
            password='AdminPass123!',
            email='admin-patient-query@example.com',
            rol='admin',
        )
        self.patients = [
            Usuario.objects.create_user(
                username=f'patient-query-{index}',
                password='TestPass123!',
                email=f'patient-query-{index}@example.com',
                rol='patient',
            )
            for index in range(2)
        ]
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_usuario_id_filtra_el_perfil_del_paciente(self):
        expected_profile = Paciente.objects.get(usuario=self.patients[1])

        response = self.client.get(
            '/api/pacientes/',
            {'usuario_id': self.patients[1].id},
        )

        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data)
        self.assertEqual([item['id'] for item in results], [expected_profile.id])
        self.assertEqual(
            results[0]['usuario']['id'],
            self.patients[1].id,
        )

    def test_flujo_de_alta_de_paciente_del_admindashboard(self):
        create_response = self.client.post(
            '/api/usuarios/',
            {
                'username': 'new-dashboard-patient',
                'password': 'TestPass123!',
                'first_name': 'New',
                'last_name': 'Patient',
                'email': '',
                'telefono': '',
                'fecha_nacimiento': None,
                'rol': 'patient',
                'tipo': 'usuarios',
            },
            format='json',
        )

        self.assertEqual(create_response.status_code, 201, create_response.data)
        usuario_id = create_response.data['id']
        new_user = Usuario.objects.get(pk=usuario_id)
        self.assertTrue(new_user.check_password('TestPass123!'))
        self.assertTrue(Paciente.objects.filter(usuario=new_user).exists())

        profiles_response = self.client.get(
            '/api/pacientes/',
            {'usuario_id': usuario_id},
        )

        self.assertEqual(profiles_response.status_code, 200)
        profiles = profiles_response.data.get('results', profiles_response.data)
        self.assertEqual(len(profiles), 1)
        paciente = profiles[0]
        self.assertEqual(paciente['usuario']['id'], usuario_id)

        update_response = self.client.patch(
            f"/api/pacientes/{paciente['id']}/",
            {
                'alergias': 'Polen',
                'grupo_sanguineo': 'O+',
                'contacto_emergencia': 'Emergency contact',
                'telefono_emergencia': '5551234',
            },
        )

        self.assertEqual(update_response.status_code, 200, update_response.data)
        self.assertEqual(update_response.data['alergias'], 'Polen')
