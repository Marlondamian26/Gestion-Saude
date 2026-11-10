import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requestPasswordReset } = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
}));

const { confirmPasswordReset } = vi.hoisted(() => ({
  confirmPasswordReset: vi.fn(),
}));

vi.mock('../../services/auth', () => ({
  requestPasswordReset,
  confirmPasswordReset,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ token: 'token-valido-123' }),
  };
});

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => ({
      forgotPasswordEmailLabel: 'Correo electrónico',
      forgotPasswordEmailPlaceholder: 'tu@correo.com',
      forgotPasswordSendButton: 'Enviar enlace de recuperación',
      forgotPasswordSuccess: 'Si el correo está registrado, recibirás un enlace de recuperación.',
      resetPasswordTitle: 'Nueva contraseña',
      resetPasswordSubtitle: 'Crea una nueva contraseña para tu cuenta.',
      resetPasswordNewPasswordLabel: 'Nueva contraseña',
      resetPasswordNewPasswordPlaceholder: 'Mínimo 8 caracteres',
      resetPasswordConfirmPasswordLabel: 'Confirmar nueva contraseña',
      resetPasswordConfirmPasswordPlaceholder: 'Repite la nueva contraseña',
      resetPasswordUpdateButton: 'Actualizar contraseña',
      resetPasswordSuccess: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
      resetPasswordBackToLogin: '¿Ya recuerdas tu contraseña?',
      loginHere: 'Inicia sesión',
      hasAccount: 'Ya tienes una cuenta?',
      appSlogan: 'Plataforma de gestión médica',
      loggingIn: 'Enviando...',
      emailRequired: 'El correo electrónico es obligatorio',
      emailInvalid: 'Ingresa un correo electrónico válido',
      confirmPasswordRequired: 'Confirma la nueva contraseña',
      minimum8Characters: 'La contraseña debe tener al menos 8 caracteres',
      passwordMismatch: 'Las contraseñas no coinciden',
    }[key] || key),
  }),
}));

import ForgotPasswordPage from '../ForgotPasswordPage';
import ResetPasswordPage from '../ResetPasswordPage';

const renderForgot = () => render(
  <MemoryRouter>
    <ForgotPasswordPage />
  </MemoryRouter>
);

const renderReset = () => render(
  <MemoryRouter>
    <ResetPasswordPage />
  </MemoryRouter>
);

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    requestPasswordReset.mockReset();
    localStorage.clear();
  });

  it('renderiza el formulario de solicitud de recuperación', () => {
    renderForgot();
    expect(screen.getByLabelText(/Correo electrónico/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar enlace de recuperación/ })).toBeInTheDocument();
  });

  it('muestra error si el email está vacío', async () => {
    const user = userEvent.setup();
    renderForgot();
    await user.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/ }));
    expect(screen.getByText(/correo electrónico es obligatorio/i)).toBeInTheDocument();
  });

  it('no llama a la API si el email tiene formato inválido', async () => {
    renderForgot();
    const input = screen.getByLabelText(/Correo electrónico/);
    act(() => {
      fireEvent.change(input, { target: { value: 'no-es-un-email' } });
    });
    fireEvent.submit(document.querySelector('form'));
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it('llama a requestPasswordReset con el email y muestra mensaje de éxito', async () => {
    const user = userEvent.setup();
    requestPasswordReset.mockResolvedValue({ detail: 'ok' });
    renderForgot();

    const input = screen.getByLabelText(/Correo electrónico/);
    fireEvent.change(input, { target: { value: 'paciente@test.com' } });
    await user.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/ }));

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith('paciente@test.com'));
    await waitFor(() => expect(screen.getByText(/Si el correo está registrado/i)).toBeInTheDocument());
  });

  it('muestra error cuando la API falla', async () => {
    const user = userEvent.setup();
    requestPasswordReset.mockRejectedValue(new Error('Error del servidor'));
    renderForgot();

    const input = screen.getByLabelText(/Correo electrónico/);
    fireEvent.change(input, { target: { value: 'paciente@test.com' } });
    await user.click(screen.getByRole('button', { name: /Enviar enlace de recuperación/ }));

    await waitFor(() => expect(screen.getByText(/Error del servidor/i)).toBeInTheDocument());
  });

  it('tiene un enlace para volver al login', () => {
    renderForgot();
    expect(screen.getByRole('link', { name: /Inicia sesión/i })).toBeInTheDocument();
  });
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    confirmPasswordReset.mockReset();
    localStorage.clear();
  });

  it('renderiza el formulario de restablecimiento con token', () => {
    renderReset();
    expect(screen.getByLabelText(/Nueva contraseña/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirmar nueva contraseña/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actualizar contraseña/ })).toBeInTheDocument();
  });

  it('muestra error si las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    renderReset();

    const input1 = screen.getByLabelText(/Nueva contraseña/);
    const input2 = screen.getByLabelText(/Confirmar nueva contraseña/);
    fireEvent.change(input1, { target: { value: 'Pass1234!' } });
    fireEvent.change(input2, { target: { value: 'OtraPass123!' } });
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }));
    expect(screen.getByText(/contraseñas no coinciden/i)).toBeInTheDocument();
  });

  it('muestra error si la contraseña es demasiado corta', async () => {
    const user = userEvent.setup();
    renderReset();

    const input1 = screen.getByLabelText(/Nueva contraseña/);
    const input2 = screen.getByLabelText(/Confirmar nueva contraseña/);
    fireEvent.change(input1, { target: { value: '123' } });
    fireEvent.change(input2, { target: { value: '123' } });
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }));
    expect(screen.getByText(/8 caracteres/i)).toBeInTheDocument();
  });

  it('llama a confirmPasswordReset y muestra mensaje de éxito', async () => {
    const user = userEvent.setup();
    confirmPasswordReset.mockResolvedValue({ detail: 'ok' });
    renderReset();

    const input1 = screen.getByLabelText(/Nueva contraseña/);
    const input2 = screen.getByLabelText(/Confirmar nueva contraseña/);
    fireEvent.change(input1, { target: { value: 'NuevaPass123!' } });
    fireEvent.change(input2, { target: { value: 'NuevaPass123!' } });
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }));

    await waitFor(() => expect(confirmPasswordReset).toHaveBeenCalledWith('token-valido-123', 'NuevaPass123!'));
    await waitFor(() => expect(screen.getByText(/Contraseña actualizada correctamente/i)).toBeInTheDocument());
  });

  it('muestra error si el token es inválido', async () => {
    const user = userEvent.setup();
    confirmPasswordReset.mockRejectedValue(new Error('Token inválido o expirado.'));
    renderReset();

    const input1 = screen.getByLabelText(/Nueva contraseña/);
    const input2 = screen.getByLabelText(/Confirmar nueva contraseña/);
    fireEvent.change(input1, { target: { value: 'NuevaPass123!' } });
    fireEvent.change(input2, { target: { value: 'NuevaPass123!' } });
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/ }));

    await waitFor(() => expect(screen.getByText(/Token inválido o expirado/i)).toBeInTheDocument());
  });
});
