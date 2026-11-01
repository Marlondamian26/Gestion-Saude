import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

import Footer from '../components/Footer';
import { ThemeProvider } from '../../context/ThemeContext';
import { LanguageProvider } from '../../context/LanguageContext';
import { promoTranslations } from '../../context/translations/promo';

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
          footerBrandText: 'Consultório médico da Dra. Belkis Morejón Acosta.',
          footerServicesTitle: 'Serviços',
          footerLegalTitle: 'Legal',
          footerContactTitle: 'Contacto',
          footerRights: 'Todos os direitos reservados.',
          footerCredit: 'Desenvolvido com ♥ para a comunidade de Benfica.',
          footerPrivacy: 'Política de Privacidade',
          footerTerms: 'Termos de Uso',
          footerAboutTitle: 'Sobre Nós',
          navInicio: 'Início',
          footerWhatsappLabel: 'WhatsApp',
          footerEmailLabel: 'Enviar correio',
          footerServices: {
            consulta: 'Consulta Médica',
            cardiologia: 'Cardiologia',
            emergencias: 'Emergências',
            vacinacao: 'Vacinação',
            analise: 'Análises Clínicas',
          },
        };
        return translations[key] || key;
      },
      language: 'pt',
      translations: {
        footerAboutTitle: 'Sobre Nós',
        footerServicesTitle: 'Serviços',
        footerServices: {
          consulta: 'Consulta Médica',
          cardiologia: 'Cardiologia',
          emergencias: 'Emergências',
          vacinacao: 'Vacinação',
          analise: 'Análises Clínicas',
        },
        footerPrivacy: 'Política de Privacidade',
        footerTerms: 'Termos de Uso',
        footerWhatsappLabel: 'WhatsApp',
        footerEmailLabel: 'Enviar correio',
      },
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

describe('Footer', () => {
  it('renderiza footerAboutTitle traducido (nao a chave crua)', () => {
    render(<Footer />, { wrapper: AllProviders });
    const about = screen.getByText('Sobre Nós');
    expect(about).toBeInTheDocument();
    expect(screen.queryByText('footerAboutTitle')).not.toBeInTheDocument();
  });

  it('nao duplica o titulo "Servicos" na coluna de servicos', () => {
    render(<Footer />, { wrapper: AllProviders });
    const servicosTexts = screen.getAllByText('Serviços');
    expect(servicosTexts.length).toBe(1);
  });

  it('lista os servicos reais sem repetir o titulo como item', () => {
    render(<Footer />, { wrapper: AllProviders });
    expect(screen.getByText('Consulta Médica')).toBeInTheDocument();
    expect(screen.getByText('Cardiologia')).toBeInTheDocument();
    expect(screen.getByText('Emergências')).toBeInTheDocument();
    expect(screen.getByText('Vacinação')).toBeInTheDocument();
    expect(screen.getByText('Análises Clínicas')).toBeInTheDocument();
  });

  it('todos os itens de servicos apontam para #servicios', () => {
    render(<Footer />, { wrapper: AllProviders });
    const serviceLinks = screen.getAllByRole('link', { name: /Consulta Médica|Cardiologia|Emergências|Vacinação|Análises Clínicas/ });
    serviceLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '#servicios');
    });
  });

  it('inclui anclas funcionais para as secoes da landing', () => {
    render(<Footer />, { wrapper: AllProviders });
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('href', '#inicio');
    expect(screen.getByRole('link', { name: 'Serviços' })).toHaveAttribute('href', '#servicios');
    expect(screen.getByRole('link', { name: 'Sobre Nós' })).toHaveAttribute('href', '#sobre-nosotros');
    expect(screen.getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '#contacto');
  });

  it('renderiza links legais para /privacidad e /terminos', () => {
    render(<Footer />, { wrapper: AllProviders });
    expect(screen.getByRole('link', { name: /Política de Privacidade/ })).toHaveAttribute('href', '/privacidad');
    expect(screen.getByRole('link', { name: /Termos de Uso/ })).toHaveAttribute('href', '/terminos');
  });

  it('mantem apenas WhatsApp como rede social real (remove Facebook/Instagram/LinkedIn/YouTube)', () => {
    render(<Footer />, { wrapper: AllProviders });
    expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Facebook/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Instagram/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/LinkedIn/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/YouTube/i)).not.toBeInTheDocument();
  });

  it('nao renderiza claves cruas de i18n', () => {
    render(<Footer />, { wrapper: AllProviders });
    const container = screen.getByRole('contentinfo');
    expect(container.textContent).not.toContain('footerAboutTitle');
    expect(container.textContent).not.toContain('footerPrivacy');
    expect(container.textContent).not.toContain('footerTerms');
  });

  it('mantem as chaves do footer e os servicos nos tres idiomas', () => {
    const footerKeys = [
      'footerBrandText',
      'footerServicesTitle',
      'footerLegalTitle',
      'footerContactTitle',
      'footerRights',
      'footerCredit',
      'footerPrivacy',
      'footerTerms',
      'footerAboutTitle',
      'footerWhatsappLabel',
      'footerEmailLabel',
      'footerWhatsappMessage',
      'navInicio',
    ];
    const serviceKeys = Object.keys(promoTranslations.promo_pt.footerServices);

    Object.values(promoTranslations).forEach((translations) => {
      footerKeys.forEach((key) => expect(translations[key]).toBeTruthy());
      serviceKeys.forEach((key) => expect(translations.footerServices[key]).toBeTruthy());
    });
  });
});
