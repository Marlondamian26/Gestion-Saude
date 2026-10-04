import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import Navbar from '../components/Navbar';
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

vi.mock('../../context/PromoLanguageContext', async () => {
  const actual = await vi.importActual('../../context/LanguageContext');
  return {
    ...actual,
    useLanguage: () => ({
      tPromo: (key) => {
        const translations = {
          navInicio: 'Início',
          navServicos: 'Serviços',
          navSobreNos: 'Sobre Nós',
          navTestimonios: 'Testemunhos',
          navContacto: 'Contacto',
          navWhatsApp: 'WhatsApp',
          navLogin: 'Entrar',
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

describe('Navbar', () => {
  it('renderiza enlaces de navegación', () => {
    render(<Navbar />, { wrapper: AllProviders });
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Serviços')).toBeInTheDocument();
    expect(screen.getByText('Sobre Nós')).toBeInTheDocument();
    expect(screen.getByText('Testemunhos')).toBeInTheDocument();
    expect(screen.getByText('Contacto')).toBeInTheDocument();
  });

  it('renderiza botón de WhatsApp', () => {
    render(<Navbar />, { wrapper: AllProviders });
    const whatsappBtn = screen.getByLabelText('WhatsApp');
    expect(whatsappBtn).toBeInTheDocument();
  });

  it('renderiza botón de menú móvil', () => {
    render(<Navbar />, { wrapper: AllProviders });
    expect(screen.getByLabelText(/menu|fechar/i)).toBeInTheDocument();
  });

  it('alterna menú móvil al hacer clic', () => {
    render(<Navbar />, { wrapper: AllProviders });
    const toggle = screen.getByLabelText(/menu|fechar/i);
    fireEvent.click(toggle);
  });
});
