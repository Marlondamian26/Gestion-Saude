import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const handlers = [
  http.get('*/usuario-actual/', () => {
    return HttpResponse.json({
      id: 1,
      username: 'test_patient',
      email: 'test@e.com',
      first_name: 'Test',
      last_name: 'User',
      rol: 'patient',
    });
  }),

  http.get('*/especialidades-publicas/', () => {
    return HttpResponse.json([
      { id: 1, nombre: 'Cardiología' },
      { id: 2, nombre: 'Dermatología' },
    ]);
  }),

  http.get('*/doctores-publicos/', () => {
    return HttpResponse.json([
      { id: 1, nombre: 'Dr. Test', especialidad: 1, especialidad_nombre: 'Cardiología',
        usuario: { first_name: 'John', last_name: 'Doe' } },
    ]);
  }),

  http.get('*/api/auth/login/', () => {
    return HttpResponse.json({ access: 'mock-token', refresh: 'mock-refresh' });
  }),
];

export const server = setupServer(...handlers);
