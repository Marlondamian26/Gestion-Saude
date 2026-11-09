import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import ScrollManager from '../../components/ScrollManager';

/**
 * Componente de prueba: renderiza ScrollManager + dos rutas navegables con
 * BrowserRouter (clásico), para ejercitar PUSH, POP y anclas del hook.
 */
const Home = () => {
  const navigate = useNavigate();
  return (
    <div data-testid="home">
      <h1>Home</h1>
      <Link to="/privacidad" data-testid="link-privacidad">
        Privacidad
      </Link>
    </div>
  );
};

const Privacidad = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div data-testid="privacidad" data-key={location.key}>
      Privacidad
      <button onClick={() => navigate(-1)} data-testid="atras">
        Atrás
      </button>
    </div>
  );
};

const TestApp = () => (
  <BrowserRouter>
    <ScrollManager anchorOffset={0} />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/privacidad" element={<Privacidad />} />
    </Routes>
  </BrowserRouter>
);

const scrollTo = window.scrollTo;

const setScrollY = (y) => {
  Object.defineProperty(window, 'scrollY', {
    writable: true,
    configurable: true,
    value: y,
  });
};

const advance = () => new Promise((r) => setTimeout(r, 120)); // dos rAF del gestor

const click = (sel) => {
  const el = document.querySelector(sel);
  expect(el).not.toBeNull();
  fireEvent(el, new MouseEvent('click', { bubbles: true }));
};

beforeEach(() => {
  scrollTo.mockClear();
  sessionStorage.clear();
  setScrollY(0);
  // Ninguna prueba debe hereder el hash de otra
  window.history.replaceState({}, '', '/');
});

afterEach(() => {
  sessionStorage.clear();
});

describe('useScrollManager (BrowserRouter clásico)', () => {
  it('carga inicial y PUSH van al top (sin smooth)', async () => {
    render(<TestApp />);
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    );

    setScrollY(500);
    fireEvent(window, new Event('scroll'));
    await advance();

    click('[data-testid="link-privacidad"]');
    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    );
    expect(document.querySelector('[data-testid="privacidad"]')).toBeInTheDocument();
  });

  it('POP restaura la posición guardada de la entrada del historial', async () => {
    render(<TestApp />);

    // Posición guardada de "/" = 300
    setScrollY(300);
    fireEvent(window, new Event('scroll'));
    await advance();

    // PUSH a "/privacidad" (top)
    click('[data-testid="link-privacidad"]');
    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    );

    // Posición de "/privacidad" = 80
    setScrollY(80);
    fireEvent(window, new Event('scroll'));
    await advance();

    // POP atrás: debe restaurar "/" a 300
    click('[data-testid="atras"]');
    await advance();

    const calls = scrollTo.mock.calls.filter((c) => c[0] && c[0].top === 300);
    expect(calls.length).toBeGreaterThan(0);
  });

  it('navegación con hash dispara scroll al ancla', async () => {
    document.body.insertAdjacentHTML(
      'afterbegin',
      '<div id="ancla-test" style="height:1500px"></div>'
    );
    try {
      render(<TestApp />);
      await waitFor(() =>
        expect(scrollTo).toHaveBeenCalledWith({
          top: 0,
          left: 0,
          behavior: 'auto',
        })
      );
      scrollTo.mockClear();

      act(() => {
        window.history.pushState({}, '', '/#ancla-test');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await advance();

      expect(scrollTo).toHaveBeenCalled();
    } finally {
      document.body.removeChild(document.getElementById('ancla-test'));
      window.history.replaceState({}, '', '/');
    }
  });

  it('no restaura sesión previa en carga directa (recarga/F5)', async () => {
    sessionStorage.setItem(
      'gestion-saude:scroll',
      JSON.stringify({ 'session-anterior': { y: 999, ts: Date.now() } })
    );
    render(<TestApp />);
    await waitFor(() =>
      expect(scrollTo).toHaveBeenLastCalledWith({
        top: 0,
        left: 0,
        behavior: 'auto',
      })
    );
    const calls = scrollTo.mock.calls.filter((c) => c[0] && c[0].top === 999);
    expect(calls.length).toBe(0);
  });
});
