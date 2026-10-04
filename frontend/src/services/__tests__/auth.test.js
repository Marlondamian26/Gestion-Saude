/**
 * Tests para el interceptor Axios y errorHandler (§4.4.3).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/auth', () => ({
  __esModule: true,
  default: {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  wakeUpBackend: vi.fn(),
}));

import { showError, setErrorHandler } from '../../services/errorHandler';

describe('Axios Error Handler', () => {
  beforeEach(() => {
    // Reset the errorHandler mock between tests
    setErrorHandler(null);
  });

  it('showError se exporta como función', () => {
    expect(typeof showError).toBe('function');
  });

  it('showError usa tipo error por defecto', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    showError('Some error');
    // showError sin handler configurado hace console.error
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('showError puede configurarse con setErrorHandler', () => {
    const handler = vi.fn();
    setErrorHandler(handler);

    showError('Network failure', 'network');
    expect(handler).toHaveBeenCalledWith('Network failure', 'network');

    showError('Server error', 'server');
    expect(handler).toHaveBeenCalledWith('Server error', 'server');

    showError('Forbidden', 'forbidden');
    expect(handler).toHaveBeenCalledWith('Forbidden', 'forbidden');
  });

  it('showError usa tipo error por defecto con handler configurado', () => {
    const handler = vi.fn();
    setErrorHandler(handler);

    showError('Some error');
    expect(handler).toHaveBeenCalledWith('Some error', 'error');
  });

  it('showError fallback a console.error sin handler', () => {
    setErrorHandler(null);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    showError('Test error', 'test');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
