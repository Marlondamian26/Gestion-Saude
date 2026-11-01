import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}));

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => ({
      legalLinksAria: 'Enlaces legales',
      termsLink: 'Términos de Uso',
      privacyLink: 'Política de Privacidad',
      version: 'Versión',
      medicalSystem: 'Sistema médico',
      appSlogan: 'Cuidando de tu salud',
      username: 'Usuario',
      usernameOrEmail: 'Usuario o correo',
      password: 'Contraseña',
      enterPassword: 'Ingresa contraseña',
      rememberMe: 'Recordarme',
      login: 'Iniciar sesión',
      noAccount: '¿No tienes cuenta?',
      registerHere: 'Regístrate aquí',
    }[key] || key),
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() }),
}));

import Footer from '../Footer';
import Login from '../Login';

const expectLegalLinks = () => {
  const navigation = screen.getByRole('navigation', { name: 'Enlaces legales' });
  expect(navigation).toHaveAttribute('aria-label', 'Enlaces legales');
  expect(screen.getByRole('link', { name: 'Términos de Uso' }))
    .toHaveAttribute('href', expect.stringMatching(/\/terminos$/));
  expect(screen.getByRole('link', { name: 'Política de Privacidad' }))
    .toHaveAttribute('href', expect.stringMatching(/\/privacidad$/));
};

describe('enlaces legales de plataforma', () => {
  it('muestra las políticas desde el footer compartido (incluido en el dashboard)', () => {
    render(<Footer />);
    expectLegalLinks();
  });

  it('muestra las políticas en el login', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expectLegalLinks();
  });
});
