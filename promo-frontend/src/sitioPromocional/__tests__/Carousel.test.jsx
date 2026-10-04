import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import Carousel from '../components/Carousel';
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

describe('Carousel', () => {
  beforeEach(() => {
    localStorage.setItem('language', 'pt');
    localStorage.setItem('theme-automatic', 'true');
  });
  it('muestra skeleton mientras carga', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<Carousel />, { wrapper: AllProviders });
    expect(document.querySelector('.promo-carousel-skeleton')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('no renderiza nada cuando no hay imágenes', async () => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve([]),
      })
    ));

    const { container } = render(<Carousel />, { wrapper: AllProviders });

    await waitFor(() => {
      expect(container.querySelector('.promo-carousel')).not.toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });
});
