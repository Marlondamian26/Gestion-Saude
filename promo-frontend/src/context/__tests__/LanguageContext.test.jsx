import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';

const TestConsumer = () => {
  const { language, setLanguage } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <button onClick={() => setLanguage('es')} data-testid="setEs">setEs</button>
    </div>
  );
};

describe('LanguageContext — sync bidireccional', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('detecta el idioma desde localStorage', () => {
    localStorage.setItem('language', 'en');
    const { getByTestId } = render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(getByTestId('lang').textContent).toBe('en');
  });

  it('persiste el idioma en localStorage al cambiar', () => {
    const { getByTestId } = render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    act(() => {
      getByTestId('setEs').click();
    });

    expect(localStorage.getItem('language')).toBe('es');
  });

  it('detecta el idioma desde el parámetro ?lang= en la URL', () => {
    window.history.replaceState({}, '', '/?lang=en');
    const { getByTestId } = render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(getByTestId('lang').textContent).toBe('en');
  });

  it('limpia el parámetro lang de la URL tras leerlo', () => {
    window.history.replaceState({}, '', '/?lang=es');
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(window.location.search).not.toContain('lang=es');
  });

  it('prefiere el idioma de la URL sobre localStorage', () => {
    localStorage.setItem('language', 'pt');
    window.history.replaceState({}, '', '/?lang=en');
    const { getByTestId } = render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(getByTestId('lang').textContent).toBe('en');
  });

  it('usa pt como fallback cuando no hay URL ni localStorage', () => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    const { getByTestId } = render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );
    expect(getByTestId('lang').textContent).toBe('pt');
  });
});
