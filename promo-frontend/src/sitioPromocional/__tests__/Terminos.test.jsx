import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import Terminos from '../pages/Terminos';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: () => null,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/terminos' }),
}));

vi.mock('../../context/LanguageContext', async () => {
  const actual = await vi.importActual('../../context/LanguageContext');
  const base = {
    footerBrandText: 'Consultório médico da Dra. Belkis Morejón Acosta.',
    footerRights: 'Todos os direitos reservados.',
    voltarInicio: 'Voltar ao início',
    terminosTitle: 'Termos de Uso',
    legalWarning: '⚠️ PLANTILLA GENÉRICA — Pendente de revisão legal antes de publicar.',
    legalUltimaActualizacao: 'Última atualização: {FECHA}',
    terminosS1Title: '1. Aceitação',
    terminosS1Body: [
      'Ao registar-se e utilizar a plataforma, o utilizador aceita estes Termos.',
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

describe('Terminos', () => {
  it('renderiza sin errores', () => {
    render(<Terminos />, { wrapper: AllProviders });
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('contiene el aviso de plantilla generica', () => {
    render(<Terminos />, { wrapper: AllProviders });
    expect(screen.getByText(/PLANTILLA GENÉRICA/)).toBeInTheDocument();
  });

  it('renderiza el titulo y secciones traducidas', () => {
    render(<Terminos />, { wrapper: AllProviders });
    expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
    expect(screen.getByText('1. Aceitação')).toBeInTheDocument();
  });

  it('no renderiza claves cruas de i18n', () => {
    render(<Terminos />, { wrapper: AllProviders });
    const container = screen.getByRole('main');
    expect(container.textContent).not.toContain('terminosTitle');
  });
});
