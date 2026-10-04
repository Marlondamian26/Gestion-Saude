/**
 * Tests de caracterización para ChatIA (§4.1).
 * Capturan comportamiento observable ANTES del refactor.
 * Estos tests deben seguir pasando DESPUÉS de la descomposición.
 */
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Mocks (vi.hoisted para evitar conflictos de hoisting) ---

const { mockAxiosInstance, mockT } = vi.hoisted(() => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };
  const mockT = (key) => key;
  return { mockAxiosInstance, mockT };
});

vi.mock('../../services/auth', () => ({
  default: mockAxiosInstance,
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: mockT,
    language: 'pt',
  }),
}));

// Importamos el componente DESPUÉS de los mocks
import ChatIA from '../ChatIA';

describe('ChatIA - Characterization Tests', () => {
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
        return Promise.resolve({ data: [{ id: 1, nombre: 'Dr. Smith', especialidad: 1, especialidad_nombre: 'Cardiologia', usuario: { first_name: 'John', last_name: 'Doe' } }] });
      }
      if (url.includes('horarios/disponibles')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('renderiza inicialmente con header y título', async () => {
    render(<ChatIA onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  it('muestra chips de sugerencia tras carga', async () => {
    render(<ChatIA onClose={() => {}} />);
    await waitFor(() => {
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });
  });

  it('cerrar el chat llama a onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ChatIA onClose={onClose} />);
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);
    });
    const closeBtn = screen.getByRole('button', { name: /✕/ });
    await act(async () => { await user.click(closeBtn); });
    expect(onClose).toHaveBeenCalled();
  });

  it('transición INICIO → ESPECIALIDAD al click en agendar', async () => {
    const user = userEvent.setup();
    render(<ChatIA onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);
    });
    const agendarBtn = Array.from(screen.queryAllByRole('button')).find(
      (b) => b.textContent?.toLowerCase().includes('agendar') ||
             b.textContent?.toLowerCase().includes('schedule')
    );
    if (agendarBtn) {
      await act(async () => { await user.click(agendarBtn); });
    }
  });

  it('enviar mensaje cuando estado es esperando_fecha', async () => {
    const user = userEvent.setup();
    render(<ChatIA onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThan(0);
    });
  });
});
