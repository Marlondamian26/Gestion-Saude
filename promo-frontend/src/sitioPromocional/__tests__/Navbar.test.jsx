import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import Navbar from '../components/Navbar';
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
          navInicio: 'Início',
          navServicios: 'Serviços',
          navSobreNos: 'Sobre Nós',
          navTestimonios: 'Testemunhos',
          navContacto: 'Contacto',
          navWhatsApp: 'WhatsApp',
          navLogin: 'Entrar',
          menu: 'Menu',
          close: 'Fechar',
          navMenuAria: 'Navegacao principal',
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
    expect(screen.getAllByText('Início').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Serviços').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sobre Nós').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Testemunhos').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Contacto').length).toBeGreaterThanOrEqual(1);
  });

  it('renderiza botón de WhatsApp', () => {
    render(<Navbar />, { wrapper: AllProviders });
    const whatsappBtn = screen.getByLabelText('WhatsApp');
    expect(whatsappBtn).toBeInTheDocument();
  });

  it('renderiza botón de menú móvil', () => {
    render(<Navbar />, { wrapper: AllProviders });
    const toggle = screen.getByRole('button', { name: /menu|fechar/i });
    expect(toggle).toBeInTheDocument();
  });

  it('alterna menú móvil al hacer clic', () => {
    render(<Navbar />, { wrapper: AllProviders });
    const toggle = screen.getByRole('button', { name: /menu|fechar/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
