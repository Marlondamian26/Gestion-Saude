# Sistema de diseño — Promo Frontend

Documentación del sistema visual del sitio promocional independiente (`promo-frontend/`).

## 1. Tokens

Fuente única de verdad: `src/sitioPromocional/styles/tokens.css`.

### 1.1 Paleta

#### Primary scale (derivada de `#00a896`)
| Token               | Valor      |
|---------------------|------------|
| `--promo-primary-50` | `#e6f7f5` |
| `--promo-primary-100`| `#b3e8e2` |
| `--promo-primary-200`| `#80d9cf` |
| `--promo-primary-300`| `#4dcabc` |
| `--promo-primary-400`| `#1abba9` |
| `--promo-primary-500`| `#00a896` (base) |
| `--promo-primary-600`| `#009687` |
| `--promo-primary-700`| `#007d70` |
| `--promo-primary-800`| `#005c53` |
| `--promo-primary-900`| `#003d37` |

#### Neutral scale (warm gray)
| Token                | Valor      |
|----------------------|------------|
| `--promo-neutral-50`  | `#faf9f7` |
| `--promo-neutral-100` | `#f4f2ee` |
| `--promo-neutral-200` | `#e6e2db` |
| `--promo-neutral-300` | `#d1ccc3` |
| `--promo-neutral-400` | `#a8a29e` |
| `--promo-neutral-500` | `#78716c` |
| `--promo-neutral-600` | `#57534e` |
| `--promo-neutral-700` | `#3d3935` |
| `--promo-neutral-800` | `#292624` |
| `--promo-neutral-900` | `#1a1816` |

#### Semantic (light theme)
| Token                     | Valor           |
|---------------------------|-----------------|
| `--promo-bg`              | `#ffffff`       |
| `--promo-bg-alt`          | `var(--promo-neutral-50)` |
| `--promo-surface`         | `#ffffff`       |
| `--promo-surface-elevated`| `#ffffff`       |
| `--promo-surface-sunken`  | `var(--promo-neutral-100)` |
| `--promo-text`            | `var(--promo-neutral-900)` |
| `--promo-text-muted`      | `var(--promo-neutral-500)` |
| `--promo-text-subtle`     | `var(--promo-neutral-400)` |
| `--promo-border`          | `var(--promo-neutral-200)` |
| `--promo-border-strong`   | `var(--promo-neutral-300)` |

#### Semantic (dark theme, `[data-theme='dark']`)
| Token                     | Valor           |
|---------------------------|-----------------|
| `--promo-bg`              | `#0e1013`       |
| `--promo-bg-alt`          | `#13161a`       |
| `--promo-surface`         | `#181c21`       |
| `--promo-surface-elevated`| `#1e2228`       |
| `--promo-surface-sunken`  | `#0b0d0f`       |
| `--promo-text`            | `#f1f5f9`       |
| `--promo-text-muted`      | `#94a3b8`       |
| `--promo-text-subtle`     | `#64748b`       |
| `--promo-border`          | `#262b33`       |
| `--promo-border-strong`   | `#343a44`       |

#### Gradientes
| Token                          | Valor |
|--------------------------------|-------|
| `--promo-gradient-primary`     | `linear-gradient(135deg, #00a896 0%, #02c4ac 100%)` |
| `--promo-gradient-primary-soft`| `linear-gradient(135deg, rgba(0,168,150,0.10) 0%, rgba(2,196,172,0.14) 100%)` |
| `--promo-gradient-hero-overlay`| `linear-gradient(135deg, rgba(0,168,150,0.88) 0%, rgba(2,196,172,0.62) 55%, rgba(0,0,0,0.35) 100%)` |

#### Sombras (multicapa)
| Token               | Valor |
|---------------------|-------|
| `--promo-shadow-xs` | `0 1px 2px rgba(26,24,22,0.04)` |
| `--promo-shadow-sm` | `0 1px 2px rgba(26,24,22,0.04), 0 2px 6px rgba(26,24,22,0.04)` |
| `--promo-shadow-md` | `0 2px 4px rgba(26,24,22,0.04), 0 6px 14px rgba(26,24,22,0.06)` |
| `--promo-shadow-lg` | `0 4px 8px rgba(26,24,22,0.05), 0 14px 32px rgba(26,24,22,0.08)` |
| `--promo-shadow-xl` | `0 8px 16px rgba(26,24,22,0.06), 0 24px 48px rgba(26,24,22,0.10)` |

#### Radios
| Token                 | Valor |
|-----------------------|-------|
| `--promo-radius-xs`   | `4px` |
| `--promo-radius-sm`   | `8px` |
| `--promo-radius-md`   | `12px` |
| `--promo-radius-lg`   | `18px` |
| `--promo-radius-xl`   | `28px` |
| `--promo-radius-full` | `9999px` |

#### Spacing (base 4px)
| Token             | Valor  |
|-------------------|--------|
| `--promo-space-1` | `0.25rem` (4px) |
| `--promo-space-2` | `0.5rem` (8px) |
| `--promo-space-3` | `0.75rem` (12px) |
| `--promo-space-4` | `1rem` (16px) |
| `--promo-space-6` | `1.5rem` (24px) |
| `--promo-space-8` | `2rem` (32px) |
| `--promo-space-12`| `3rem` (48px) |
| `--promo-space-16`| `4rem` (64px) |
| `--promo-space-24`| `6rem` (96px) |

### 1.2 Tipografía

| Token                   | Valor |
|-------------------------|-------|
| `--promo-font-sans`     | `'Inter', system-ui, -apple-system, sans-serif` |
| `--promo-font-display`  | `'Fraunces', 'Playfair Display', Georgia, serif` |

#### Fluid type scale
| Token            | Rango           |
|------------------|-----------------|
| `--promo-fs-xs`  | `clamp(0.75rem, ...)` |
| `--promo-fs-sm`  | `clamp(0.875rem, ...)` |
| `--promo-fs-base`| `clamp(1rem, ...)`     |
| `--promo-fs-lg`  | `clamp(1.125rem, ...)` |
| `--promo-fs-xl`  | `clamp(1.25rem, ...)`  |
| `--promo-fs-2xl` | `clamp(1.5rem, ...)`   |
| `--promo-fs-3xl` | `clamp(1.875rem, ...)` |
| `--promo-fs-4xl` | `clamp(2.25rem, ...)`  |
| `--promo-fs-5xl` | `clamp(2.75rem, ...)`  |

#### Line heights
| Token                  | Valor |
|------------------------|-------|
| `--promo-lh-tight`     | `1.1` |
| `--promo-lh-snug`      | `1.25`|
| `--promo-lh-normal`    | `1.5` |
| `--promo-lh-relaxed`   | `1.7` |

### 1.3 Motion

| Token             | Valor |
|-------------------|-------|
| `--promo-ease`    | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--promo-ease-out`| `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--promo-dur-fast`| `150ms` |
| `--promo-dur-base`| `250ms` |
| `--promo-dur-slow`| `400ms` |

## 2. Primitivas CSS

Archivo: `src/sitioPromocional/styles/primitives.css`.

Clases utilitarias específicas del promo:
- `.promo-container`
- `.promo-container-narrow`
- `.promo-section`
- `.promo-eyebrow`
- `.promo-heading`
- `.promo-body`
- `.promo-card`

## 3. Componentes y patrones

### 3.1 Hero
- Full-bleed con imagen de fondo
- Overlay gradiente + fade inferior
- Título display con `<em>` gradiente
- Badge pill + acciones en fila
- Stagger de entrada animado

### 3.2 Carousel
- Crossfade 800ms + Ken Burns sutil
- Autoplay 6s con pausa on hover / visibilitychange
- Dots tipo pill activo
- Soporte táctil (swipe)
- `aria-live="polite"` + `role="tablist"`

### 3.3 Navbar
- Scroll-aware (transparente → blur)
- Indicador de sección activa
- Mobile menu con focus trap + Esc
- Links como anchors (`<a href="#id">`)

### 3.4 Secciones de contenido
- **Servicios:** grid con hover elevado + franja superior gradient
- **SobreNosotros:** layout asimétrico, stats gradient, features con checks
- **Testimonios:** comillas decorativas, estrellas `#fbbf24`, hover lift
- **Contacto:** cards clickeables con arrow indicator
- **CTA:** fondo gradient con patrón radial
- **Footer:** 4 columnas, redes sociales circulares

## 4. Accesibilidad

- Skip link visible en focus
- `:focus-visible` global con outline `2px solid var(--promo-primary-500)`
- `role="region"` + `aria-labelledby` en todas las secciones principales
- `aria-live="polite"` en carousel
- `prefers-reduced-motion` respetado en todas las animaciones
- Scrollbar theme-aware

## 5. Breakpoints

| Nombre     | Ancho    |
|------------|----------|
| Mobile     | ≤480px   |
| Tablet     | ≤768px   |
| Desktop    | >768px   |

Mobile-first. Todos los grids se apilan en mobile.

## 6. Cómo usar los tokens

```css
.mi-componente {
  background: var(--promo-surface);
  border: 1px solid var(--promo-border);
  border-radius: var(--promo-radius-lg);
  padding: var(--promo-space-8);
  box-shadow: var(--promo-shadow-sm);
  transition: transform var(--promo-dur-slow) var(--promo-ease),
              box-shadow var(--promo-dur-slow) var(--promo-ease);
}
```

## 7. Fuentes

Cargadas via Google Fonts en `index.html`:
- **Fraunces** (display): pesos 500, 600, 700
- **Inter** (cuerpo): pesos 400, 500, 600

Ambas con `display=swap` y fallback `system-ui`.
