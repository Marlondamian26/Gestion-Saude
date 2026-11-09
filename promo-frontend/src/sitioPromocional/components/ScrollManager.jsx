import { useScrollManager } from '../hooks/useScrollManager';

/**
 * ScrollManager — gestor de scroll por ruta del sitio promocional.
 * Se integra una sola vez en el layout raíz (dentro de <BrowserRouter>).
 * No renderiza nada visible.
 *
 * Reglas:
 *  - PUSH/REPLACE -> top de la vista.
 *  - POP -> restaura la posición guardada para esa entrada del historial.
 *  - URL con hash -> scroll al ancla de la landing (respeta navbar fijo).
 *  - Carga directa / recarga -> top (o ancla si hay hash), nunca hereda
 *    sesión previa.
 *
 * anchorOffset = 88: compensa el navbar fijo (scroll-margin-top: 88px en
 * promocional.css) al hacer scroll programático a un ancla.
 */
export default function ScrollManager({ anchorOffset = 88 } = {}) {
  useScrollManager({ anchorOffset });
  return null;
}
