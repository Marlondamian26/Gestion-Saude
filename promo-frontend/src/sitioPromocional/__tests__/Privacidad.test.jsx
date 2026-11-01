import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import Privacidad from '../pages/Privacidad';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: () => null,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/privacidad' }),
}));

vi.mock('../../context/LanguageContext', async () => {
  const actual = await vi.importActual('../../context/LanguageContext');
  const base = {
    footerBrandText: 'Consultório médico da Dra. Belkis Morejón Acosta.',
    footerRights: 'Todos os direitos reservados.',
    voltarInicio: 'Voltar ao início',
    privacidadTitle: 'Política de Privacidade',
    legalWarning: '⚠️ PLANTILLA GENÉRICA — Pendente de revisão legal antes de publicar.',
    legalUltimaActualizacao: 'Última atualização: {FECHA}',
    privacidadS1Title: '1. Responsável pelo tratamento',
    privacidadS1Body: [
      '{{NOMBRE_CLINICA}}. Direção: {{DIRECCION}}. Email: {{EMAIL_CONTACTO}}. Telefone: {{TELEFONO}}.',
    ],
  };
  return {
    ...actual,
    useLanguage: () => ({
      tPromo: (key, params = {}) => {
        let text = base[key] || key;
        Object.keys(params).forEach((param) => {
          text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
        });
        return text;
      },
      language: 'pt',
      translations: { promo_pt: base },
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

describe('Privacidad', () => {
  it('renderiza sin errores', () => {
    render(<Privacidad />, { wrapper: AllProviders });
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('contiene el aviso de plantilla generica', () => {
    render(<Privacidad />, { wrapper: AllProviders });
    expect(screen.getByText(/PLANTILLA GENÉRICA/)).toBeInTheDocument();
  });

  it('contiene el email de contacto', () => {
    render(<Privacidad />, { wrapper: AllProviders });
    expect(screen.getByText(/angobelkis72@gmail.com/)).toBeInTheDocument();
  });

  it('renderiza el titulo y secciones traducidas', () => {
    render(<Privacidad />, { wrapper: AllProviders });
    expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    expect(screen.getByText('1. Responsável pelo tratamento')).toBeInTheDocument();
  });

  it('no renderiza claves cruas de i18n', () => {
    render(<Privacidad />, { wrapper: AllProviders });
    const container = screen.getByRole('main');
    expect(container.textContent).not.toContain('privacidadTitle');
    expect(container.textContent).not.toContain('{{NOMBRE_CLINICA}}');
  });
});
