/**
 * Tests para el hook del Asistente de citas (§4.5.4).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('admin: seleccionar agendar muestra el selector de pacientes (estado elegir_paciente)', async () => {
    mockAxiosInstance.get.mockImplementation((url) => {
      if (url.includes('usuario-actual')) {
        return Promise.resolve({ data: { id: 1, username: 'admin', rol: 'admin' } });
      }
      if (url.includes('especialidades-publicas')) {
        return Promise.resolve({ data: [{ id: 1, nombre: 'Cardiologia' }] });
      }
      if (url.includes('doctores-publicos')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    const { result } = renderHook(() => useChatIA());

    await act(async () => {
      await result.current.inicializar(false);
    });

    expect(result.current.userRole).toBe('admin');

    await act(async () => {
      await result.current.seleccionarOpcion('agendar');
    });

    expect(result.current.estado).toBe('elegir_paciente');
  });

  it('patient: seleccionar agendar salta el selector (estado elegir_especialidad)', async () => {
    const { result } = renderHook(() => useChatIA());

    await act(async () => {
      await result.current.inicializar(false);
    });

    expect(result.current.userRole).toBe('patient');

    await act(async () => {
      await result.current.seleccionarOpcion('agendar');
    });

    expect(result.current.estado).toBe('elegir_especialidad');
  });

  it('buscarPacientes: 1 caracter no busca; 2+ caracteres busca con debounce 300ms', async () => {
    mockAxiosInstance.get.mockImplementation((url) => {
      if (url.includes('usuario-actual')) {
        return Promise.resolve({ data: { id: 1, username: 'admin', rol: 'admin' } });
      }
      if (url.includes('especialidades-publicas')) {
        return Promise.resolve({ data: [{ id: 1, nombre: 'Cardiologia' }] });
      }
      if (url.includes('doctores-publicos')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('buscar-pacientes')) {
        return Promise.resolve({ data: { resultados: [{ id: 1, display_text: 'Juan Pérez' }] } });
      }
      return Promise.resolve({ data: [] });
    });

    vi.useFakeTimers();

    const { result } = renderHook(() => useChatIA());

    await act(async () => {
      await result.current.inicializar(false);
    });

    // 1 caractér → no busca
    act(() => {
      result.current.buscarPacientes('J');
    });
    expect(result.current.busquedaPaciente).toBe('J');

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    const pacientesCalls = mockAxiosInstance.get.mock.calls.filter(
      ([url]) => url.includes('buscar-pacientes')
    );
    expect(pacientesCalls).toHaveLength(0);

    // 2+ caracteres → busca con debounce 300ms
    act(() => {
      result.current.buscarPacientes('Ju');
    });
    expect(result.current.busquedaPaciente).toBe('Ju');
    expect(result.current.sugerenciasPacientes).toHaveLength(0);

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      'buscar-pacientes/',
      expect.objectContaining({ params: { query: 'Ju' } })
    );
    expect(result.current.sugerenciasPacientes).toHaveLength(1);
    expect(result.current.sugerenciasPacientes[0]).toEqual({
      id: 1,
      display_text: 'Juan Pérez',
    });
  });
});
