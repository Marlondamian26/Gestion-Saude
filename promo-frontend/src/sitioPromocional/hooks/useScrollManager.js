import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useScrollManager
 * Gestión única de scroll por ruta para frontends con React Router clásico
 * (BrowserRouter + Routes, sin data router ni ScrollRestoration nativo).
 *
 * Reglas:
 *  - PUSH/REPLACE (clic en <Link>, navigate(), redirecciones) -> top de la vista.
 *  - POP (atrás/adelante del navegador) -> restaura la posición guardada para
 *    esa entrada del historial (clave: location.key).
 *  - URL con hash (carga directa, recarga o ancla interna) -> scroll al ancla.
 *  - Carga directa / F5 / pestaña nueva -> top (o ancla), nunca hereda la
 *    sesión anterior.
 *
 * Persiste window.scrollY en sessionStorage por entrada de historial,
 * actualizado con throttle (requestAnimationFrame) mientras el usuario scrolla.
 */

const STORAGE_KEY = 'gestion-saude:scroll';
const MAX_ENTRIES = 50;

// scrollRestoration = 'manual' tan pronto como se importa el módulo (antes del
// primer paint) para que el navegador no restaure posiciones por su cuenta.
if (typeof history !== 'undefined' && 'scrollRestoration' in history) {
  try {
    history.scrollRestoration = 'manual';
  } catch {
    // No bloquear la app si el navegador no lo permite
  }
}

function readPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writePositions(positions) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // cuota de sessionStorage agotada: se ignora silenciosamente
  }
}

function prunePositions(positions) {
  return Object.fromEntries(
    Object.entries(positions)
      .sort(([, a], [, b]) => (b && b.ts || 0) - (a && a.ts || 0))
      .slice(0, MAX_ENTRIES)
  );
}

export function useScrollManager({ anchorOffset = 0 } = {}) {
  const location = useLocation();
  const navType = useRef('push'); // 'push' | 'pop'
  const initialized = useRef(false);
  const handled = useRef(new Set());
  const saveRafId = useRef(null);
  const layoutRafId = useRef(null);
  const pendingSave = useRef(false);
  const currentKey = useRef(null);

  const keyFor = useCallback(
    (loc) => loc.key || `${loc.pathname}${loc.search}${loc.hash}`,
    []
  );

  const savePosition = useCallback((key, y) => {
    if (key == null) return;
    const positions = readPositions();
    positions[key] = { y: Math.max(0, y), ts: Date.now() };
    writePositions(prunePositions(positions));
  }, []);

  const getPosition = useCallback((key) => {
    const positions = readPositions();
    const entry = positions[key];
    return entry ? entry.y : null;
  }, []);

  const scrollTo = useCallback(
    (y) => {
      window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'auto' });
    },
    []
  );

  const scrollToTop = useCallback(() => scrollTo(0), [scrollTo]);

  const scrollToAnchor = useCallback(
    (hash) => {
      if (!hash) return;
      let id = hash.startsWith('#') ? hash.slice(1) : hash;
      try {
        id = decodeURIComponent(id);
      } catch {
        // ignorar hash mal formado
      }
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      const target =
        window.scrollY + el.getBoundingClientRect().top - anchorOffset;
      scrollTo(target);
    },
    [anchorOffset, scrollTo]
  );

  // --- Persistencia de posición por entrada del historial -----------------
  useEffect(() => {
    currentKey.current = keyFor(location);

    let initialSave = true;
    const tick = () => {
      pendingSave.current = false;
      const key = currentKey.current;
      if (initialSave) {
        initialSave = false;
        const positions = readPositions();
        if (positions && positions[key]) return; // no sobrescribir posición guardada (POP)
      }
      savePosition(key, window.scrollY);
    };

    const onScroll = () => {
      if (!pendingSave.current) {
        pendingSave.current = true;
        saveRafId.current = requestAnimationFrame(tick);
      }
    };

    onScroll(); // posición inicial de la ruta que se monta
    window.addEventListener('scroll', onScroll, { passive: true });

    const persistOnUnload = () =>
      savePosition(currentKey.current, window.scrollY);
    window.addEventListener('pagehide', persistOnUnload);
    window.addEventListener('beforeunload', persistOnUnload);

    return () => {
      if (saveRafId.current) cancelAnimationFrame(saveRafId.current);
      pendingSave.current = false; // StrictMode re-monta el efecto: liberar el cerrojo
      window.removeEventListener('scroll', onScroll, { passive: true });
      window.removeEventListener('pagehide', persistOnUnload);
      window.removeEventListener('beforeunload', persistOnUnload);
    };
  }, [location, savePosition, keyFor]);

  // --- Detección de POP (solo atrás/adelante del navegador) --------------
  // Los navigate() y <Link> de React Router usan pushState/replaceState y
  // nunca disparan popstate.
  useEffect(() => {
    const onPopState = () => {
      navType.current = 'pop';
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // --- Motor de scroll por tipo de navegación -----------------------------
  useEffect(() => {
    const key = keyFor(location);
    currentKey.current = key;

    if (!initialized.current) {
      // Primera monta de la app: carga directa, F5 o pestaña nueva.
      // Nunca se restaura una sesión previa.
      initialized.current = true;
      if (location.hash) {
        const f1 = requestAnimationFrame(() => {
          layoutRafId.current = requestAnimationFrame(() =>
            scrollToAnchor(location.hash)
          );
        });
        layoutRafId.current = f1;
      } else {
        const f1 = requestAnimationFrame(() => {
          layoutRafId.current = requestAnimationFrame(scrollToTop);
        });
        layoutRafId.current = f1;
      }
      pruneHandled(handled, key);
      handled.current.add(`${key}:init`);
      return;
    }

    pruneHandled(handled, key);
    const token = `${key}:${navType.current}`;
    if (handled.current.has(token)) {
      navType.current = 'push';
      return;
    }
    handled.current.add(token);

    const run = () => {
      if (location.hash) {
        const f1 = requestAnimationFrame(() => {
          layoutRafId.current = requestAnimationFrame(() =>
            scrollToAnchor(location.hash)
          );
        });
        layoutRafId.current = f1;
      } else if (navType.current === 'pop') {
        const y = getPosition(key);
        const f1 = requestAnimationFrame(() => {
          layoutRafId.current = requestAnimationFrame(() => scrollTo(y ?? 0));
        });
        layoutRafId.current = f1;
      } else {
        const f1 = requestAnimationFrame(() => {
          layoutRafId.current = requestAnimationFrame(scrollToTop);
        });
        layoutRafId.current = f1;
      }
      navType.current = 'push';
    };

    const f1 = requestAnimationFrame(() => {
      layoutRafId.current = requestAnimationFrame(run);
    });
    layoutRafId.current = f1;
  }, [location, keyFor, scrollToAnchor, scrollToTop, getPosition, scrollTo]);

  return null;
}

function pruneHandled(handledRef, currentKey) {
  // Evita que el Set crezca sin límite entre navegaciones largas
  const prefix = `${currentKey}:`;
  for (const token of handledRef.current) {
    if (!token.startsWith(prefix)) {
      handledRef.current.delete(token);
    }
  }
}
