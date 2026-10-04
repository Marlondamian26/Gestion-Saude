/**
 * Tests para ThemeContext (§4.5.4).
 * Verifica detección de prefers-color-scheme y persistencia en localStorage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';

const TestConsumer = () => {
  const { theme, toggleTheme, setThemeManually, isAutomatic } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="automatic">{String(isAutomatic)}</span>
      <button onClick={toggleTheme} data-testid="toggle">toggle</button>
      <button onClick={() => setThemeManually('dark')} data-testid="setDark">setDark</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it('isAutomatic inicia en true (modo automático)', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(getByTestId('automatic').textContent).toBe('true');
  });

  it('persiste el tema manual en localStorage', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Cambiar a dark manualmente
    act(() => {
      getByTestId('setDark').click();
    });

    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('theme-automatic')).toBe('false');
  });

  it('toggleTheme cambia entre light y dark', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    // Initial theme is light (prefers-color-scheme: false)
    expect(getByTestId('theme').textContent).toBe('light');

    act(() => {
      getByTestId('toggle').click();
    });

    // Should toggle to dark (from light)
    expect(getByTestId('theme').textContent).toBe('dark');
  });
});
