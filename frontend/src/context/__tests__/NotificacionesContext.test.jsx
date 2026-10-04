/**
 * Tests para NotificacionesContext — SSE + polling optimizado (§5.1).
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
  return { mockAxiosInstance: ax, mockT: t, mockUser: user };
});

// Mock EventSource (no available in jsdom)
const mockEventSource = vi.hoisted(() => {
  const instances = [];
  const handlers = { onmessage: null, onerror: null, close: vi.fn() };
  return {
    __instances: instances,
    __handlers: handlers,
    __mockInstance: {
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onmessage: null,
      onerror: null,
    },
  };
});

global.EventSource = vi.fn(() => mockEventSource.__mockInstance);

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    t: mockT,
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('../../config/constants', () => ({
  APP_NAME: 'ChatIA',
  API_BASE_URL: 'http://localhost/api',
}));

vi.mock('../../services/auth', () => ({
  default: mockAxiosInstance,
  wakeUpBackend: vi.fn().mockResolvedValue(undefined),
}));

import { NotificacionesProvider, useNotificaciones } from '../../context/NotificacionesContext';

const TestConsumer = () => {
  const { notificaciones, noLeidas, loading, cargarNotificaciones, marcarComoLeida, sseActive } = useNotificaciones();
  return (
    <div>
      <span data-testid="loading">{loading ? 'true' : 'false'}</span>
      <span data-testid="noLeidas">{noLeidas}</span>
      <span data-testid="count">{notificaciones.length}</span>
      <span data-testid="sseActive">{sseActive ? 'true' : 'false'}</span>
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

  it('inicia EventSource con SSE al montar con usuario', async () => {
    localStorage.setItem('access_token', 'mock-token');
    mockAxiosInstance.get.mockResolvedValue({ data: [] });

    render(
      <NotificacionesProvider>
        <TestConsumer />
      </NotificacionesProvider>
    );

    await waitFor(() => {
      expect(global.EventSource).toHaveBeenCalledWith(
        expect.stringContaining('notificaciones/stream/?token=mock-token')
      );
    });
  });
});
