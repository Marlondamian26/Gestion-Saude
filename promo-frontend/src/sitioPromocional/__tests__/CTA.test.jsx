import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import CTA from '../components/CTA';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('../../utils/apiUtils', () => ({
  wakeUpBackend: async () => {},
}));

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: () => null,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('../../context/LanguageContext', async () => {
  const actual = await vi.importActual('../../context/LanguageContext');
  return {
    ...actual,
    useLanguage: () => ({
      tPromo: (key) => {
        const translations = {
          ctaTitle: 'Pronto para cuidar da sua saúde?',
          ctaSubtitle: 'Agende sua consulta agora e tenha uma atenção médica de excelência.',
          ctaRegister: 'Registar',
          ctaLogin: 'Entrar',
          navWhatsApp: 'WhatsApp',
        };
        return translations[key] || key;
      },
      language: 'pt',
      setLanguage: vi.fn(),
    }),
    LanguageProvider: ({ children }) => children,
  };
});

const AllProviders = ({ children }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('CTA', () => {
  it('renderiza título y subtítulo', () => {
    render(<CTA />, { wrapper: AllProviders });
    expect(screen.getByText(/Pronto para cuidar/i)).toBeInTheDocument();
  });

  it('renderiza botones de acción', () => {
    render(<CTA />, { wrapper: AllProviders });
    expect(screen.getByRole('link', { name: /Registar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Entrar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /WhatsApp/i })).toBeInTheDocument();
  });

  it('abre WhatsApp al hacer clic', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<CTA />, { wrapper: AllProviders });
    const whatsappBtn = screen.getByRole('button', { name: /WhatsApp/i });
    fireEvent.click(whatsappBtn);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
