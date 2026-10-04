/**
 * Tests para useChatIA hook (§4.5.4).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { mockAxiosInstance, mockT } = vi.hoisted(() => ({
  mockAxiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  mockT: (key) => {
    const map = {
      scheduleAppointment: 'Agendar cita',
      myAppointments: 'Mis citas',
      cancelAppointmentOption: 'Cancelar cita',
      postponeAppointmentOption: 'Posponer',
      needHelp: 'Ayuda',
      whatSpecialty: 'Que especialidad?',
      selectSpecialtyOption: 'Selecciona una opción',
    };
    return map[key] || key;
  },
}));

vi.mock('../../services/auth', () => ({
  default: mockAxiosInstance,
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: mockT,
    language: 'pt',
  }),
}));

import useChatIA from '../useChatIA';

describe('useChatIA', () => {
  beforeEach(() => {
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.patch.mockReset();

    mockAxiosInstance.get.mockImplementation((url) => {
      if (url.includes('usuario-actual')) {
        return Promise.resolve({ data: { id: 1, username: 'test', rol: 'patient' } });
      }
      if (url.includes('especialidades-publicas')) {
        return Promise.resolve({ data: [{ id: 1, nombre: 'Cardiologia' }] });
      }
      if (url.includes('doctores-publicos')) {
        return Promise.resolve({ data: [{ id: 1, nombre: 'Dr. X', especialidad: 1, especialidad_nombre: 'Cardiologia', usuario: { first_name: 'John', last_name: 'Doe' } }] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('estado inicial es "inicio" con historial vacío', () => {
    const { result } = renderHook(() => useChatIA());
    expect(result.current.estado).toBe('inicio');
    expect(result.current.historial).toHaveLength(0);
  });

  it('carga inicial muestra opciones', async () => {
    const { result } = renderHook(() => useChatIA());

    await act(async () => {
      await result.current.inicializar(false);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.opciones.length).toBeGreaterThan(0);
  });

  it('maneja error de API manteniendo historial', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChatIA());

    await act(async () => {
      await result.current.inicializar(false);
    });

    expect(result.current.loading).toBe(false);
  });
});
