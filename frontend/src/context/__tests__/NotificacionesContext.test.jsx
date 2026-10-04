/**
 * Tests para NotificacionesContext — polling 30s y marcar como leída (§4.5.4).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import React from 'react';

const { mockAxiosInstance, mockT, mockUser } = vi.hoisted(() => {
  const ax = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };
  const t = (key, fallback) => fallback || key;
  const user = { id: 1, username: 'test', rol: 'patient' };
  const login = vi.fn();
  const logout = vi.fn();
  return { mockAxiosInstance: ax, mockT: t, mockUser: user, mockLogin: login, mockLogout: logout };
});

// Mock LanguageContext
vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    t: mockT,
  }),
}));

// Mock AuthContext — use stable references to prevent re-renders
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock constants
vi.mock('../../config/constants', () => ({
  APP_NAME: 'ChatIA',
}));

vi.mock('../../services/auth', () => ({
  default: mockAxiosInstance,
  wakeUpBackend: vi.fn().mockResolvedValue(undefined),
}));

import { NotificacionesProvider, useNotificaciones } from '../../context/NotificacionesContext';

const TestConsumer = () => {
  const { notificaciones, noLeidas, loading, cargarNotificaciones, marcarComoLeida } = useNotificaciones();
  return (
    <div>
      <span data-testid="loading">{loading ? 'true' : 'false'}</span>
      <span data-testid="noLeidas">{noLeidas}</span>
      <span data-testid="count">{notificaciones.length}</span>
      <button onClick={cargarNotificaciones} data-testid="reload">reload</button>
      <button onClick={() => marcarComoLeida(1)} data-testid="markRead">markRead</button>
    </div>
  );
};

describe('NotificacionesContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('carga notificaciones inicialmente', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: [
        { id: 1, titulo: 'test', mensaje: 'msg', leida: false },
        { id: 2, titulo: 'read', mensaje: 'msg2', leida: true },
      ],
    });

    const { getByTestId, unmount } = render(
      <NotificacionesProvider>
        <TestConsumer />
      </NotificacionesProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });

    expect(getByTestId('count').textContent).toBe('2');
    expect(getByTestId('noLeidas').textContent).toBe('1');
    unmount();
  });

  it('marcar como leída actualiza el contador', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: [
        { id: 1, titulo: 'test', mensaje: 'msg', leida: false },
      ],
    });
    mockAxiosInstance.post.mockResolvedValue({ data: { ok: true } });

    const { getByTestId, unmount } = render(
      <NotificacionesProvider>
        <TestConsumer />
      </NotificacionesProvider>
    );

    await waitFor(() => {
      expect(getByTestId('noLeidas').textContent).toBe('1');
    });

    await act(async () => {
      getByTestId('markRead').click();
    });

    await waitFor(() => {
      expect(getByTestId('noLeidas').textContent).toBe('0');
    });
    unmount();
  });

  it('no muestra notificaciones cuando lista está vacía', async () => {
    mockAxiosInstance.get.mockResolvedValue({ data: [] });

    const { getByTestId, unmount } = render(
      <NotificacionesProvider>
        <TestConsumer />
      </NotificacionesProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('false');
    });

    expect(getByTestId('count').textContent).toBe('0');
    expect(getByTestId('noLeidas').textContent).toBe('0');
    unmount();
  });
});
