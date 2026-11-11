import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { login } = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock('../../services/auth', () => ({
  default: { login },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => ({
      username: 'Usuario',
      password: 'Contraseña',
      usernameOrEmail: 'Usuario o correo',
      enterPassword: 'Contraseña',
      invalidCredentials: 'Credenciales invalidas',
      login: 'Iniciar sesion',
      loggingIn: 'Ingresando...',
      forgotPassword: '¿Olvidaste tu contraseña?',
      registerHere: 'Regístrate',
      noAccount: '¿No tienes cuenta?',
      termsLink: 'Terminos',
      privacyLink: 'Privacidad',
      legalLinksAria: 'Enlaces legales',
      appSlogan: 'Gestion-Saude',
    }[key] || key),
  }),
}));

import Login from '../Login';

const renderLogin = () => render(
  <MemoryRouter>
    <Login />
  </MemoryRouter>
);

describe('Login — regresión accesibilidad y inputs (P0/P1)', () => {
  beforeEach(() => {
    login.mockReset();
    localStorage.clear();
  });

  it('renderiza input de usuario con tipo texto y autocomplete username', () => {
    renderLogin();
    const input = screen.getByPlaceholderText(/Usuario o correo/);
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('autocomplete', 'username');
  });

  it('renderiza input de contraseña con tipo password y autocomplete current-password', () => {
    renderLogin();
    const input = screen.getByPlaceholderText(/Contraseña/);
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
  });

  it('mantiene ambos inputs de autenticacion en 16px para evitar auto-zoom movil', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/Usuario o correo/).style.fontSize).toBe('16px');
    expect(screen.getByPlaceholderText(/Contraseña/).style.fontSize).toBe('16px');
  });

  it('muestra etiquetas visibles para los inputs', () => {
    const { container } = renderLogin();
    const labels = Array.from(container.querySelectorAll('label')).map(
      (l) => (l.textContent || '').trim()
    );
    expect(labels).toContain('Usuario');
    expect(labels).toContain('Contraseña');
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('id', 'login-username');
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('id', 'login-password');
  });

  it('limpia el mensaje de error al cambiar un input', async () => {
    login.mockRejectedValue({ response: { status: 401 } });
    renderLogin();
    const username = screen.getByPlaceholderText(/Usuario o correo/);
    const password = screen.getByPlaceholderText(/Contraseña/);
    fireEvent.change(username, { target: { value: 'usuario' } });
    fireEvent.change(password, { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar sesion/ }));
    await waitFor(() =>
      expect(screen.getByText(/credenciales/i)).toBeInTheDocument()
    );
    fireEvent.change(username, { target: { value: 'usuario2' } });
    expect(screen.queryByText(/credenciales/i)).not.toBeInTheDocument();
  });
});
