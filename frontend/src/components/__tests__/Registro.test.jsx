import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { axiosPost, cargarUsuario, navigate } = vi.hoisted(() => ({
  axiosPost: vi.fn(),
  cargarUsuario: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../../services/auth', () => ({
  default: { post: axiosPost },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ cargarUsuario }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => ({
      aceptaTerminosPrefix: 'Acepto los',
      termsLink: 'Términos de Uso',
      and: 'y',
      privacyLink: 'Política de Privacidad',
      legalLinksAria: 'Enlaces legales',
      acceptTermsRequired: 'Debes aceptar los términos y la política de privacidad.',
      createAccount: 'Crear Cuenta',
      registering: 'Registrando...',
      firstName: 'Nombre',
      lastName: 'Apellido',
      username: 'Usuario',
      passwordLabel: 'Contraseña',
      registrationSuccess: 'Registro realizado con éxito',
      errorLoadingUser: 'No se pudo cargar el usuario',
      fixFormErrors: 'Corrige los errores del formulario',
    }[key] || key),
  }),
}));

import Registro from '../Registro';

const renderRegistro = () => render(
  <MemoryRouter>
    <Registro />
  </MemoryRouter>
);

describe('Registro — aceptación legal', () => {
  beforeEach(() => {
    axiosPost.mockReset();
    cargarUsuario.mockReset().mockResolvedValue({});
    navigate.mockReset();
    localStorage.clear();
  });

  it('mantiene deshabilitado el registro hasta aceptar las políticas', async () => {
    const user = userEvent.setup();
    renderRegistro();
    const submit = screen.getByRole('button', { name: /Crear Cuenta/ });
    const checkbox = screen.getByRole('checkbox', { name: /Acepto los/ });

    expect(submit).toBeDisabled();
    await user.click(checkbox);
    expect(submit).toBeEnabled();
  });

  it('enlaza las políticas del promo desde la casilla de aceptación', () => {
    renderRegistro();

    expect(screen.getByRole('link', { name: 'Términos de Uso' }))
      .toHaveAttribute('href', expect.stringMatching(/\/terminos$/));
    expect(screen.getByRole('link', { name: 'Política de Privacidad' }))
      .toHaveAttribute('href', expect.stringMatching(/\/privacidad$/));
  });

  it('envía acepta_terminos=true en el payload de registro', async () => {
    const user = userEvent.setup();
    axiosPost.mockResolvedValue({
      data: { access: 'access-token', refresh: 'refresh-token' },
    });
    const { container } = renderRegistro();
    fireEvent.change(container.querySelector('[name="first_name"]'), {
      target: { value: 'Ada' },
    });
    fireEvent.change(container.querySelector('[name="last_name"]'), {
      target: { value: 'Lovelace' },
    });
    fireEvent.change(container.querySelector('[name="username"]'), {
      target: { value: 'ada-lovelace' },
    });
    fireEvent.change(container.querySelector('[name="password"]'), {
      target: { value: 'StrongPass123!' },
    });
    await user.click(screen.getByRole('checkbox', { name: /Acepto los/ }));
    await user.click(screen.getByRole('button', { name: /Crear Cuenta/ }));

    await waitFor(() => expect(axiosPost).toHaveBeenCalled());
    expect(axiosPost.mock.calls[0][0]).toBe('registro/');
    expect(axiosPost.mock.calls[0][1]).toMatchObject({
      username: 'ada-lovelace',
      first_name: 'Ada',
      last_name: 'Lovelace',
      acepta_terminos: true,
    });
  });
});
