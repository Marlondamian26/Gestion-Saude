import { useScrollManager } from '../hooks/useScrollManager';

/**
 * ScrollManager — gestor de scroll por ruta del frontend de plataforma.
 * Se integra una sola vez en el layout raíz (dentro de <BrowserRouter>).
 * No renderiza nada visible.
 *
 * Reglas:
 *  - PUSH/REPLACE -> top de la vista.
 *  - POP -> restaura la posición guardada para esa entrada del historial.
 *  - URL con hash -> scroll al ancla (con anchorOffset si se configura).
 *  - Carga directa / recarga -> top, nunca hereda sesión previa.
 */
export default function ScrollManager({ anchorOffset = 0 } = {}) {
  useScrollManager({ anchorOffset });
  return null;
}
