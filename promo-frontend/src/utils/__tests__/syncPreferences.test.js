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

  it('ignora temas inválidos', () => {
    window.history.replaceState({}, '', '/?theme=invalid');
    const result = readFromUrl();
    expect(result.theme).toBeUndefined();
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

  it('no sobrescribe localStorage si no hay parámetro', () => {
    localStorage.setItem('language', 'es');
    window.history.replaceState({}, '', '/');
    readFromUrl();
    expect(localStorage.getItem('language')).toBe('es');
  });
});

describe('syncPreferences — buildPlatformUrl', () => {
  it('añade parámetros de idioma y tema a la URL', () => {
    const url = buildPlatformUrl('http://localhost:5173/login', { language: 'es', theme: 'dark' });
    expect(url).toBe('http://localhost:5173/login?lang=es&theme=dark');
  });

  it('añade solo idioma si theme es auto', () => {
    const url = buildPlatformUrl('http://localhost:5173/login', { language: 'en', theme: 'auto' });
    expect(url).toContain('lang=en');
    expect(url).toContain('theme=auto');
  });

  it('preserva parámetros existentes en la URL', () => {
    const url = buildPlatformUrl('https://example.com/page?ref=nav', { language: 'pt' });
    expect(url).toContain('ref=nav');
    expect(url).toContain('lang=pt');
  });

  it('funciona con URLs https de producción', () => {
    const url = buildPlatformUrl('https://gestion-saude.onrender.com/login', { language: 'es', theme: 'light' });
    expect(url).toContain('https://gestion-saude.onrender.com/login');
    expect(url).toContain('lang=es');
    expect(url).toContain('theme=light');
  });
});

describe('syncPreferences — buildPromoUrl', () => {
  it('comporta igual que buildPlatformUrl', () => {
    const url = buildPromoUrl('http://localhost:5174', { language: 'pt', theme: 'dark' });
    expect(url).toBe('http://localhost:5174/?lang=pt&theme=dark');
  });
});
