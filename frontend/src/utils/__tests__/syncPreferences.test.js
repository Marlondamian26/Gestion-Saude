import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFromUrl, buildPlatformUrl, buildPromoUrl } from '../syncPreferences';

describe('syncPreferences — readFromUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lee el idioma del parámetro ?lang= en la URL', () => {
    window.history.replaceState({}, '', '/?lang=es');
    const result = readFromUrl();
    expect(result.language).toBe('es');
    expect(localStorage.getItem('language')).toBe('es');
  });

  it('lee el tema del parámetro ?theme= en la URL', () => {
    window.history.replaceState({}, '', '/?theme=dark');
    const result = readFromUrl();
    expect(result.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('theme-automatic')).toBe('false');
  });

  it('establece theme-automatic=true cuando theme=auto', () => {
    window.history.replaceState({}, '', '/?theme=auto');
    readFromUrl();
    expect(localStorage.getItem('theme-automatic')).toBe('true');
  });

  it('ignora idiomas inválidos', () => {
    window.history.replaceState({}, '', '/?lang=xx');
    const result = readFromUrl();
    expect(result.language).toBeUndefined();
    expect(localStorage.getItem('language')).toBeNull();
  });

  it('limpia los parámetros lang y theme de la URL tras leerlos', () => {
    window.history.replaceState({}, '', '/?lang=en&theme=dark');
    readFromUrl();
    expect(window.location.search).not.toContain('lang=en');
    expect(window.location.search).not.toContain('theme=dark');
  });

  it('devuelve objeto vacío si no hay parámetros', () => {
    window.history.replaceState({}, '', '/');
    const result = readFromUrl();
    expect(result).toEqual({});
  });
});

describe('syncPreferences — buildPromoUrl', () => {
  it('añade parámetros de idioma y tema a la URL del promo', () => {
    const url = buildPromoUrl('https://gestion-saude-promo.onrender.com', { language: 'es', theme: 'dark' });
    expect(url).toContain('lang=es');
    expect(url).toContain('theme=dark');
  });

  it('preserva parámetros existentes en la URL', () => {
    const url = buildPromoUrl('https://gestion-saude-promo.onrender.com/?ref=nav', { language: 'pt' });
    expect(url).toContain('ref=nav');
    expect(url).toContain('lang=pt');
  });
});

describe('syncPreferences — buildPlatformUrl', () => {
  it('añade parámetros de idioma y tema a la URL de la plataforma', () => {
    const url = buildPlatformUrl('https://gestion-saude.onrender.com/login', { language: 'es', theme: 'light' });
    expect(url).toContain('lang=es');
    expect(url).toContain('theme=light');
  });
});
