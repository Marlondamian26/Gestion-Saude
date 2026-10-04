/**
 * Tests para ErrorBoundary (§4.4.5).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => key,
    language: 'pt',
  }),
}));

const SafeComponent = () => <div>Safe content</div>;

const BombComponent = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('Boom!');
  return <div>Safe content</div>;
};

describe('ErrorBoundary', () => {
  it('renderiza children cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('muestra fallback cuando un hijo lanza', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    const fallback = screen.queryByText('error');
    expect(fallback).toBeTruthy();
    spy.mockRestore();
  });

  it('reset via prop key vuelve a montar', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary key="a">
        <BombComponent shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Safe content')).toBeNull();

    // Re-render con key diferente → boundary reset
    rerender(
      <ErrorBoundary key="b">
        <SafeComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
    spy.mockRestore();
  });
});
