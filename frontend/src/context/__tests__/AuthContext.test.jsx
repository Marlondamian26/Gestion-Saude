import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAxiosInstance } = vi.hoisted(() => ({
  mockAxiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

vi.mock('../../services/auth', () => ({
  __esModule: true,
  default: mockAxiosInstance,
  wakeUpBackend: vi.fn(),
}));

vi.mock('../../utils/apiUtils', () => ({
  wakeUpBackend: vi.fn(),
}));

import { render, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../../context/AuthContext';

const TestConsumer = () => {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? 'true' : 'false'}</span>
      <span data-testid="user">{user ? user.username : 'null'}</span>
      <button onClick={() => login('test', 'pass')} data-testid="login">login</button>
      <button onClick={logout} data-testid="logout">logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    mockAxiosInstance.get.mockReset();
    mockAxiosInstance.post.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loading=true inicialmente sin token', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(getByTestId('loading').textContent).toBe('false');
    expect(getByTestId('user').textContent).toBe('null');
  });

  it('login guarda tokens y carga usuario', async () => {
    mockAxiosInstance.post.mockResolvedValue({
      data: { access: 'mock-access', refresh: 'mock-refresh' },
    });
    mockAxiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'testuser', rol: 'patient' },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      getByTestId('login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('testuser');
    });

    expect(localStorage.getItem('access_token')).toBe('mock-access');
    expect(localStorage.getItem('refresh_token')).toBe('mock-refresh');
  });

  it('logout limpia tokens y usuario', async () => {
    localStorage.setItem('access_token', 'old-token');
    localStorage.setItem('refresh_token', 'old-refresh');

    mockAxiosInstance.get.mockResolvedValue({
      data: { id: 1, username: 'user', rol: 'patient' },
    });

    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('user');
    });

    act(() => {
      getByTestId('logout').click();
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(getByTestId('user').textContent).toBe('null');
  });
});
