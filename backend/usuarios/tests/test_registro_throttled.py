"""
Test for §1.6: verify that the registration endpoint is throttled
(5 requests per minute for anonymous users).
"""
from django.test import TestCase, override_settings
from django.core.cache import cache
from django.urls import reverse
from usuarios.models import Usuario


@override_settings(DEBUG=True)
class TestRegistroThrottled(TestCase):

    def setUp(self):
        cache.clear()

    def test_registro_success_within_limit(self):
        url = reverse('registro')
        data = {
            'username': 'testuser1',
            'password': 'Test1234!',
            'email': 'test1@test.com',
            'rol': 'patient',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 201)

    def test_registro_throttled_after_5_requests(self):
        url = reverse('registro')
        base_data = {
            'password': 'Test1234!',
            'email': 'test@test.com',
            'rol': 'patient',
        }

        # 5 successful registrations
        for i in range(5):
            data = {**base_data, 'username': f'user{i}', 'email': f'user{i}@test.com'}
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, 201, f"Request {i+1} should succeed")

        # 6th request should be throttled (429)
        data = {**base_data, 'username': 'user6', 'email': 'user6@test.com'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 429, "6th request should be throttled")
