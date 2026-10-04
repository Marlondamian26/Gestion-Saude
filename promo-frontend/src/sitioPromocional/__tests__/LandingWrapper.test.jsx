import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import LandingWrapper from '../components/LandingWrapper';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('../../utils/apiUtils', () => ({
  wakeUpBackend: async () => {},
  fetchWithRetry: async (url, options = {}, retries = 3, timeout = 15000) => {
    const response = await fetch(url, options);
    return response;
  },
  getImageUrl: (path) => (path.startsWith('http') ? path : `http://localhost:5174/api${path}`),
}));

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: () => null,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/' }),
}));

const AllProviders = ({ children }) => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </LanguageProvider>
  );
};

describe('LandingWrapper', () => {
  beforeEach(() => {
    localStorage.setItem('language', 'pt');
    localStorage.setItem('theme-automatic', 'true');
  });
  it('renderiza navegación y toggles', () => {
    const { container } = render(<LandingWrapper />, { wrapper: AllProviders });
    expect(container.querySelector('.promo-navbar')).toBeInTheDocument();
  });

  it('aplica data-theme al contenedor principal', () => {
    const { container } = render(<LandingWrapper />, { wrapper: AllProviders });
    const mainDiv = container.querySelector('.sitio-promocional');
    expect(mainDiv).toHaveAttribute('data-theme');
  });

  it('renderiza los toggles flotantes de tema e idioma', () => {
    render(<LandingWrapper />, { wrapper: AllProviders });
    expect(screen.getByRole('button', { name: /modo automático|cambiar a modo/i })).toBeInTheDocument();
  });
});
