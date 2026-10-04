import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import Carousel from '../components/Carousel';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/PromoLanguageContext';

vi.mock('../../utils/apiUtils', () => ({
  wakeUpBackend: vi.fn().mockResolvedValue(undefined),
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
  it('muestra skeleton mientras carga', async () => {
    global.fetch = vi.fn(() => new Promise(() => {}));
    render(<Carousel />, { wrapper: AllProviders });
    expect(document.querySelector('.promo-carousel-skeleton')).toBeInTheDocument();
    global.fetch.mockRestore();
  });

  it('renderiza empty state cuando no hay imágenes', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve([]),
      })
    );

    render(<Carousel />, { wrapper: AllProviders });

    await waitFor(() => {
      expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument();
    });

    global.fetch.mockRestore();
  });
});
