# 🎨 Guía de Referencia UI/UX — Gestion-Saude

> Sistema de diseño, estilo, animaciones, tratamiento de imágenes y patrones visuales de los dos frontends de Gestion-Saude. Documento destinado a usarse como **referente para futuros proyectos** y para mantener la coherencia visual del producto.

**Frontends cubiertos:**
1. **Sitio web promocional** (`promo-frontend/`) — sitio público, landing, secciones, páginas legales. (Énfasis principal de esta guía)
2. **Frontend de la plataforma** (`frontend/`) — aplicación autenticada multi-rol (admin, doctor, enfermería, paciente).

---

## 1. Arquitectura y convenciones generales

| Concepto | Detalle |
|----------|---------|
| Stack | React + Vite + React Router v7 (`BrowserRouter` + `Routes`, clásico, no data router) |
| Estilos | CSS puro con **Custom Properties (CSS tokens)**. No se usa Tailwind ni librerías de UI. |
| Reset | `box-sizing: border-box`, `margin: 0`, `padding: 0` en `*`. |
| Fuente base | `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| Fuente de visualización | `'Fraunces', 'Playfair Display', Georgia, serif` (títulos hero, secciones, stats) |
| Escala tipográfica | Fluid type con `clamp()` (375px → 1440px) |
| Tema | Claro y oscuro, alternables mediante `data-theme` en `<html>` o `<body>` |
| Reducido de movimiento | `prefers-reduced-motion: reduce` desactiva animaciones y transiciones en ambos frontends |
| Scrollbar | Personalizada con `::-webkit-scrollbar-*` (ancho 10px, thumb theme-aware) |
| Skip link | `.promo-skip-link` (sitio promocional), posición absoluta, foco visible, `z-index: 9999` |

### Estructura de carpetas (sitio promocional)
```
promo-frontend/src/
├── index.css                 # Reset base, tipografía, botones, inputs, scrollbar, skip link
├── sitioPromocional/
│   ├── styles/
│   │   ├── tokens.css        # Fuente única de verdad: colores, tipografía, spacing, motion, z-index
│   │   ├── primitives.css    # Clases utilitarias (.promo-container, .promo-card, .promo-section, etc.)
│   │   ├── promocional.css   # Reglas por componente (hero, carrusel, servicios, footer, legal, etc.)
│   │   └── promo-responsive.css # Breakpoints y toggles flotantes
│   ├── components/
│   │   ├── Navbar.jsx        # Navbar fijo + menú móvil (fixed, z-index, aria-expanded)
│   │   ├── Hero.jsx          # Hero con imagen dinámica del backend + parallax suave
│   │   ├── Carousel.jsx      # Carrusel crossfade con Ken Bones, autoplay, touch, a11y
│   │   ├── Servicios.jsx, SobreNosotros.jsx, Testimonios.jsx, Contacto.jsx, CTA.jsx
│   │   ├── Footer.jsx, Privacidad.jsx, Terminos.jsx, LegalPage.jsx
│   │   ├── ScrollManager.jsx # Gestor de scroll por ruta (PUSH→top, POP→restore, hash→ancla)
│   │   └── ThemeToggle.jsx, LanguageToggle.jsx
│   ├── hooks/
│   │   └── useScrollManager.js
│   ├── pages/
│   └── config/constants.js
```

---

## 2. Sistema de diseño — Sitio promocional (`tokens.css`)

### 2.1 Escala de color primario (derivada de `#00a896` — teal médico)

| Token | Valor | Uso |
|-------|-------|-----|
| `--promo-primary-50` | `#e6f7f5` | Fondos suaves, estados activos |
| `--promo-primary-100` | `#b3e8e2` | Bordes suaves, hover |
| `--promo-primary-200` | `#80d9cf` | |
| `--promo-primary-300` | `#4dcabc` | |
| `--promo-primary-400` | `#1abba9` | |
| `--promo-primary-500` | `#00a896` | **Color principal** (botones primarios, enlaces, gradientes) |
| `--promo-primary-600` | `#009687` | Hover, estados activos |
| `--promo-primary-700` | `#007d70` | |
| `--promo-primary-800` | `#005c53` | |
| `--promo-primary-900` | `#003d37` | Texto sobre fondos oscuros |

### 2.2 Escala neutral (warm gray)

| Token | Valor | Uso |
|-------|-------|-----|
| `--promo-neutral-50` | `#faf9f7` | Fondos alternativos, sección alt |
| `--promo-neutral-100` | `#f4f2ee` | |
| `--promo-neutral-200` | `#e6e2db` | Bordes por defecto |
| `--promo-neutral-300` | `#d1ccc3` | Bordes fuertes |
| `--promo-neutral-400` | `#a8a29e` | Texto sutil |
| `--promo-neutral-500` | `#78716c` | Texto muted |
| `--promo-neutral-600` | `#57534e` | |
| `--promo-neutral-700` | `#3d3935` | |
| `--promo-neutral-800` | `#292624` | Fondos oscuros claros |
| `--promo-neutral-900` | `#1a1816` | Texto principal |

### 2.3 Colores semánticos (modo claro)

| Token | Valor | Uso |
|-------|-------|-----|
| `--promo-bg` | `#ffffff` | Fondo principal |
| `--promo-bg-alt` | `var(--promo-neutral-50)` | Fondo de sección alternativa |
| `--promo-surface` | `#ffffff` | Superficie de cards |
| `--promo-surface-elevated` | `#ffffff` | Superficie elevada |
| `--promo-surface-sunken` | `var(--promo-neutral-100)` | Superficie hundida |
| `--promo-text` | `var(--promo-neutral-900)` | Texto principal |
| `--promo-text-muted` | `var(--promo-neutral-500)` | Texto secundario |
| `--promo-text-subtle` | `var(--promo-neutral-400)` | Texto sutil |
| `--promo-border` | `var(--promo-neutral-200)` | Bordes por defecto |
| `--promo-border-strong` | `var(--promo-neutral-300)` | Bordes fuertes |
| `--promo-success` | `#10b981` | Éxito |
| `--promo-warning` | `#fbbf24` | Advertencia |

### 2.4 Gradientes

| Token | Valor |
|-------|-------|
| `--promo-gradient-primary` | `linear-gradient(135deg, #00a896 0%, #02c4ac 100%)` |
| `--promo-gradient-primary-soft` | `linear-gradient(135deg, rgba(0,168,150,0.10) 0%, rgba(2,196,172,0.14) 100%)` |
| `--promo-gradient-hero-overlay` | `linear-gradient(135deg, rgba(0,168,150,0.88) 0%, rgba(2,196,172,0.62) 55%, rgba(0,0,0,0.35) 100%)` |
| `--promo-gradient-fade-bottom` | `linear-gradient(180deg, transparent 55%, var(--promo-bg) 100%)` |
| `--promo-gradient-surface` | `linear-gradient(180deg, #ffffff 0%, var(--promo-neutral-50) 100%)` |

### 2.5 Sombras (multicapa)

| Token | Valor |
|-------|-------|
| `--promo-shadow-xs` | `0 1px 2px rgba(26,24,22,0.04)` |
| `--promo-shadow-sm` | doble capa `0 1px 2px ... 0.04`, `0 2px 6px ... 0.04` |
| `--promo-shadow-md` | `0 2px 4px ... 0.04`, `0 6px 14px ... 0.06` |
| `--promo-shadow-lg` | `0 4px 8px ... 0.05`, `0 14px 32px ... 0.08` |
| `--promo-shadow-xl` | `0 8px 16px ... 0.06`, `0 24px 48px ... 0.10` |
| `--promo-shadow-primary` | `0 6px 16px rgba(0,168,150,0.24)`, `0 12px 28px rgba(0,168,150,0.14)` |

### 2.6 Radios de borde

| Token | Valor |
|-------|-------|
| `--promo-radius-xs` | `4px` |
| `--promo-radius-sm` | `8px` |
| `--promo-radius-md` | `12px` |
| `--promo-radius-lg` | `18px` |
| `--promo-radius-xl` | `28px` |
| `--promo-radius-2xl` | `36px` |
| `--promo-radius-full` | `9999px` |

### 2.7 Espaciado (base 4px)

| Token | Valor |
|-------|-------|
| `--promo-space-1` | `0.25rem` |
| `--promo-space-2` | `0.5rem` |
| `--promo-space-3` | `0.75rem` |
| `--promo-space-4` | `1rem` |
| `--promo-space-5` | `1.25rem` |
| `--promo-space-6` | `1.5rem` |
| `--promo-space-8` | `2rem` |
| `--promo-space-10` | `2.5rem` |
| `--promo-space-12` | `3rem` |
| `--promo-space-16` | `4rem` |
| `--promo-space-20` | `5rem` |
| `--promo-space-24` | `6rem` |
| `--promo-space-32` | `8rem` |
| `--promo-gutter` | `clamp(1.25rem, 4vw, 2.5rem)` |
| `--promo-section-py` | `clamp(4rem, 8vw, 7rem)` |

### 2.8 Tipografía (fluid scale con `clamp`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--promo-fs-xs` | `clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)` | Pie de página, legal small |
| `--promo-fs-sm` | `clamp(0.875rem, 0.84rem + 0.20vw, 0.9375rem)` | Eyebrow, badge, captions |
| `--promo-fs-base` | `clamp(1rem, 0.96rem + 0.25vw, 1.0625rem)` | Cuerpo, inputs, botones |
| `--promo-fs-lg` | `clamp(1.125rem, 1.05rem + 0.40vw, 1.25rem)` | Subtítulos, hero subtítulo |
| `--promo-fs-xl` | `clamp(1.25rem, 1.15rem + 0.60vw, 1.5rem)` | Enlaces móviles, tarjetas h3 |
| `--promo-fs-2xl` | `clamp(1.5rem, 1.3rem + 1.00vw, 2rem)` | Secciones h2 pequeñas |
| `--promo-fs-3xl` | `clamp(1.875rem, 1.5rem + 1.60vw, 2.75rem)` | Secciones h2 |
| `--promo-fs-4xl` | `clamp(2.25rem, 1.7rem + 2.40vw, 3.75rem)` | Hero h1, testimonios stats |
| `--promo-fs-5xl` | `clamp(2.75rem, 1.9rem + 3.40vw, 4.5rem)` | Hero h1 grande |

**Líneas de altura:**
- `--promo-lh-tight: 1.1` — títulos grandes
- `--promo-lh-snug: 1.25`
- `--promo-lh-normal: 1.5` — cuerpo
- `--promo-lh-relaxed: 1.7` — párrafos largos, testimonios

**Tracking (espaciado de letras):**
- `--promo-tracking-tight: -0.02em` — títulos
- `--promo-tracking-normal: 0`
- `--promo-tracking-wide: 0.04em` — eyebrow, textos en mayúscula

### 2.9 Motion (transiciones y easing)

| Token | Valor | Uso |
|-------|-------|-----|
| `--promo-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Easing estándar (salida suave) |
| `--promo-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Easing de salida |
| `--promo-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Easing entrada/salida |
| `--promo-dur-fast` | `150ms` | Hover rápido, focus |
| `--promo-dur-base` | `250ms` | Botones, enlaces, cambios de estado |
| `--promo-dur-slow` | `400ms` | Tarjetas, contenedores |
| `--promo-dur-slower` | `600ms` | Hero fade-in, menú móvil |

### 2.10 Layout y z-index

| Token | Valor | Uso |
|-------|-------|-----|
| `--promo-container` | `1200px` | Contenedor máximo principal |
| `--promo-container-narrow` | `720px` | Contenido estrecho (legal, captions) |
| `--navbar-height` | `72px` (desktop), `64px` (≤768px), `60px` (≤480px) | Altura del navbar fijo |
| `--promo-z-navbar` | `2100` | Navbar fijo (contexto de apilamiento menú móvil) |
| `--promo-z-mobile-menu` | `1100` | Menú desplegable móvil |
| `--promo-z-floating-toggles` | `2000` | Toggles flotantes (tema/idioma) |
| `--promo-z-skip-link` | `9999` | Saltar al contenido (siempre encima) |

### 2.11 Dark theme (`:root[data-theme='dark']`)

Invierte la escala neutra (fondos oscuros `#0e1013` → `#1a1816`), ajusta primario a `#02c4ac` (más luminoso en oscuro), sombras más intensas con `rgba(0,0,0,0.35)`, y gradientes de hero más opacos. Las tarjetas y surfaces usan `--promo-surface: #181c21`.

---

## 3. Primitivas y clases utilitarias (`primitives.css`)

| Clase | Descripción |
|-------|-------------|
| `.promo-container` | `max-width: 1200px`, margen auto, padding con gutter |
| `.promo-container-narrow` | `max-width: 720px` |
| `.promo-section` | `padding-block: var(--promo-section-py)`, `overflow-x: hidden` |
| `.promo-eyebrow` | Etiqueta superior pequeña, mayúsculas, color primario-600 |
| `.promo-heading` | Familia display, peso 600, línea tight, color texto |
| `.promo-heading-display` | `fs-4xl`, peso 600 |
| `.promo-body` | Familia sans, fs-base, línea relaxed, color muted |
| `.promo-card` | Surface, borde, radius-lg, shadow-sm, transiciones transform+shadow+border (dur-slow) |
| `.promo-card:hover` | `translateY(-4px)`, shadow-lg |

---

## 4. Tratamiento de imágenes (sitio promocional)

### 4.1 Reglas base (`index.css`)
```css
img, svg { display: block; max-width: 100%; height: auto; }
```

### 4.2 Hero — imagen principal
- **Ubicación:** `promo-frontend/.../components/Hero.jsx`
- **Origen:** Backend (`/sitio-imagenes/hero/`), con fallback a placeholder estilizado (`promo-hero-placeholder` con gradiente primario e icono de estetoscopio).
- **Carga:** `getImageUrl()` resuelve rutas relativas contra el backend; maneja `http://`, `/media/`, `/sitio/`.
- **Presentación:** `.promo-hero-media` con `position: absolute; inset: 0; z-index: 0; background-size: cover; background-position: center 30%;`. Capas de overlay (`::after` con gradiente hero, `::before` con radial izquierda) y fade inferior (`promo-hero-fade`).
- **Efecto parallax:** `transform: translateY(calc(var(--hero-scroll-y, 0) * 0.15))` vinculado al scroll de la página (JS en `Hero.jsx`). `will-change: transform`. Desactivado con `prefers-reduced-motion`.
- **Dimensiones:** `.promo-hero` con `min-height: clamp(560px, 88vh, 820px)`; en móvil ≤480px `clamp(480px, 80vh, 600px)`.
- **Anclas de sección:** `section[id] { scroll-margin-top: 88px; }` para que los ítems del navbar no queden ocultos por el navbar fijo.

### 4.3 Carrusel de imágenes
- **Ubicación:** `promo-frontend/.../components/Carousel.jsx`
- **Origen:** Backend (`/sitio-imagenes/carousel/`), con reintentos exponenciales y `wakeUpBackend()`.
- **Dimensiones:** `height: clamp(400px, 60vh, 620px)` (desktop), `clamp(300px, 50vh, 420px)` (tablet), `clamp(240px, 40vh, 320px)` (móvil).
- **Transición:** Crossfade con `opacity 800ms ease-in-out` entre slides. Ken Burns sutil: `transform: scale(1) → scale(1.03)` en 6s (`linear`) sobre el slide activo.
- **Lazy loading:** `loading={index === currentIndex ? 'eager' : 'lazy'}`, `decoding="async"`, `fetchPriority={index === 0 ? 'high' : undefined}`.
- **Skeleton:** Shimmer lineal (`linear-gradient 90deg`, animación 1.5s) mientras carga.
- **Estados vacíos/error:** Gradiente primario con mensaje centrado y borde radius-lg.
- **Navegación:** Flechas (prev/next) con `backdrop-filter: blur(10px)`, radius 50%, z-index 10; dots activos con width 32px y radius 4px; botón play/pause.
- **Táctil:** Soporte touch (swipe > 50px para navegar), pausa al hacer hover y al cambiar de pestaña (`visibilitychange`).
- **Autoplay:** 6000ms entre slides, pausa 10000ms tras interacción.

### 4.4 Avatares y elementos circulares
| Elemento | Dimensiones | Fondo | Radio |
|----------|-------------|-------|-------|
| `.promo-doctor-avatar` (Hero) | `clamp(60px, 12vw, 80px)` cuadrado | Gradiente primario | 50% |
| `.promo-testimonio-avatar` | `40px × 40px` | Gradiente primario | 50% |
| `.promo-servicio-icon` | `56px × 56px` | `promo-primary-50` | 50% |
| `.promo-contacto-icon` | `56px × 56px` | `promo-primary-50` | 50% |
| `.promo-footer-logo-icon` | `40px × 40px` | Gradiente primario | radius-md |
| `.promo-footer-social a` | `40px × 40px` | `promo-surface-sunken` | 50% |

### 4.5 Imágenes en "Sobre nosotros"
- **Contenedor:** `.promo-sobre-image-card` con `aspect-ratio: 1`, `width: clamp(280px, 32vw, 400px)`, radius 50%, gradiente primario soft, shadow-xl.
- **Imagen:** `.promo-sobre-image` con `width: 85%; height: 85%; object-fit: cover; border-radius: 50%; border: 8px solid surface; shadow-lg`.

### 4.6 Placeholder de hero
Cuando no hay imagen cargada: `.promo-hero-placeholder` con `background: var(--promo-gradient-primary)`, icono de estetoscopio a `clamp(4rem, 10vw, 8rem)` y opacidad 0.15.

---

## 5. Componentes y patrones visuales del sitio promocional

### 5.1 Navbar
- **Tipo:** Fijo (`position: fixed; top: 0`), `z-index: 2100`, altura 72px (desktop), 64px (tablet), 60px (móvil).
- **Efecto scroll:** Cambia a `promo-navbar--scrolled` con `backdrop-filter: blur(14px) saturate(180%)` y fondo semitransparente tras scroll > 40px.
- **Contenedor:** `.promo-navbar-inner promo-container` (max-width 1200px).
- **Logo:** Izquierda, texto display, icono de estetoscopio.
- **Enlaces desktop:** `.promo-navbar-links` (ocultos en móvil).
- **Acciones:** WhatsApp (verde `#25D366`), CTA a plataforma, botón toggle hamburguesa.
- **Menú móvil:** `.promo-navbar-mobile` con `position: fixed`, `top: var(--navbar-height)`, `left/right: 0`, `width: 100%`, `height: calc(100dvh - var(--navbar-height))`, `overflow-y: auto`, `overscroll-behavior: contain`, `padding-bottom` con `env(safe-area-inset-bottom)`. Abierto con `transform: translateY(0)`, cerrado con `translateY(-100%)`, duración 300ms.
- **Accesibilidad:** `aria-expanded` en el toggle, `aria-label` cambiante, `aria-controls="navbar-links"`, cierre con `Escape`, clic fuera, cierre al navegar, bloqueo de `body.style.overflow = 'hidden'` cuando está abierto.

### 5.2 Secciones (patrón común)
Cada sección usa `.promo-section` (padding-block con `--promo-section-py`, `overflow-x: hidden`) y encabezado centrado:
- `.promo-section-label` — etiqueta con fondo primario, color blanco, radius 20px, mayúsculas.
- `.promo-section-title` — `clamp(1.75rem, 5vw, 2.5rem)`, familia display, peso 700.
- `.promo-section-subtitle` — `1.1rem`, color muted, max-width 700px, centrado.

### 5.3 Servicios
- Grid `repeat(auto-fit, minmax(300px, 1fr))`, gap space-6.
- Tarjetas `.promo-servicio-card`: surface, borde, radius-lg, padding space-8, texto centrado, shadow-sm.
- Hover: `translateY(-4px)`, shadow-lg, border primario-200, línea superior animada `scaleX(0→1)`.
- Iconos circulares 56px con fondo `promo-primary-50`.

### 5.4 Sobre nosotros
- Layout asimétrico `grid-template-columns: 5fr 7fr` (desktop), 1fr (móvil).
- Imagen circular con borde 8px y shadow-lg.
- Stats con números gradiente primario (background-clip text), label en mayúsculas.
- Features en grid 2 columnas con iconos circulares 24px.

### 5.5 Testimonios
- Grid `repeat(3, 1fr)` (desktop), 1fr (móvil).
- Tarjetas con comilla grande (`\201C`, 80px, color primario-100) en esquina superior izquierda.
- Texto en itálica, color muted, línea relaxed.
- Autor con avatar circular 40px y nombre en negrita.
- Hover: `translateY(-4px)`, shadow-lg.

### 5.6 Contacto
- Grid `repeat(4, 1fr)` (desktop), 1fr (móvil).
- Tarjetas clickeables con icono circular 56px, flecha animada (opacidad 0→1, translateX -8px→0).
- Cursor pointer.

### 5.7 CTA (Call to Action)
- `padding-block: space-24`, fondo gradiente primario con dos radiales decorativos (blanco translúcido).
- Texto blanco, título `fs-4xl`, subtítulo `fs-lg` con opacidad 0.9, max-width 720px.
- Botones centrados: primario (fondo blanco, color primario-700) y secundario (fondo rgba blanco 0.08, backdrop-filter blur(6px)).

### 5.8 Footer
- Grid 4 columnas (2fr 1fr 1fr 1.5fr), 1fr en móvil.
- Brand con logo (gradiente primario, radius-md) y texto.
- Enlaces de sección con hover: color primario-600, `padding-left: 4px`.
- Redes sociales: 40px, radius 50%, fondo surface-sunken, hover gradiente primario + `translateY(-2px)`.
- Bottom con borde superior y texto muted centrado.

### 5.9 Páginas legales (Privacidad / Términos)
- `.promo-legal-page`: max-width 720px, margen auto, padding space-24 + gutter, línea relaxed.
- Encabezado con enlace de retorno y icono.
- `.promo-legal-warning`: fondo surface-sunken, borde izquierdo 4px color warning.
- Títulos `fs-4xl`, sección `fs-xl`, color primario-700.
- Párrafos en muted.
- Fecha de actualización alineada a la derecha, texto pequeño.

---

## 6. Animaciones y transiciones (sitio promocional)

### 6.1 Keyframes definidos

| Animación | Duración | Efecto | Uso |
|-----------|----------|--------|-----|
| `fadeInUp` | 0.6s ease-out | Opacidad 0→1 + translateY 20px→0 | Secciones, elementos al entrar |
| `fadeInRight` | 0.6s ease-out | Opacidad 0→1 + translateX 20px→0 | Elementos laterales |
| `fadeInLeft` | 0.6s ease-out | Opacidad 0→1 + translateX -20px→0 | Elementos laterales |
| `heroFadeUp` | 0.6s ease-out | Opacidad 0→1 + translateY 16px→0 | Hero (badge, título, subtítulo, acciones con delays escalonados 0/100/200/300ms) |
| `float` | 20s infinite ease-in-out | Translate + scale en 4 puntos | Burbujas del frontend de plataforma |
| `shimmer` | 1.5s infinite linear | Background-position 200%→-200% | Skeleton del carrusel |
| `pulse` | 1.5s ease-in-out infinite | Opacidad 0.6→1→0.6 | Dots skeleton del carrusel |

### 6.2 Clases de animación
- `.animate-fade-up`, `.animate-fade-right`, `.animate-fade-left`
- `.animate-in` (opacidad 1, para control por JS)
- `.hero-hero-text.animate` (con delays escalonados por hijo)

### 6.3 Reducido de movimiento
Tanto en `index.css` como `tokens.css` y `promocional.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  html { scroll-behavior: auto; }
  .promo-hero-media { transform: none !important; }
  .promo-carousel-image { transition: none; transform: scale(1); }
  .promo-hero-text.animate, .animate-fade-* { animation: none; opacity: 1; transform: none; }
}
```

---

## 7. Accesibilidad (sitio promocional)

| Elemento | Implementación |
|----------|---------------|
| Skip link | `.promo-skip-link`, `position: absolute; top: -40px`, `:focus { top: 6px; }`, `z-index: 9999` |
| Focus visible | `outline: 2px solid var(--promo-primary-500)`, `outline-offset: 3px`, `border-radius: var(--promo-radius-xs)` en botones, enlaces, flechas del carrusel, dots |
| Aria navbar | `aria-expanded` (true/false), `aria-label` cambia "Abrir/Cerrar menú", `aria-controls="navbar-links"` |
| Aria carrusel | `aria-roledescription="carousel"`, `aria-live="polite"`, slides con `aria-hidden`, `role="group"`, `aria-label="Slide X de Y"`, dots con `role="tab"`, `aria-selected` |
| Anclas de sección | `section[id] { scroll-margin-top: 88px; }` para no quedar ocultas bajo navbar fijo |
| Tema oscuro | `data-theme="dark"` con contraste ajustado (texto `#f1f5f9` sobre fondos `#0e1013`) |
| Touch targets | Botones y enlaces móviles con padding mínimo que garantiza ≥ 44px de alto (menú móvil `padding: var(--promo-space-3) 0` en enlaces, botones 44px) |

---

## 8. Sistema de diseño — Frontend de la plataforma (`theme.css`)

### 8.1 Colores por rol (modo claro y oscuro)

| Rol | Claro (base) | Claro (light) | Claro (soft) | Claro (bg) | Oscuro (base) |
|-----|-------------|---------------|--------------|------------|---------------|
| Admin | `#7c3aed` | `#a78bfa` | `#c4b5fd` | `#f5f3ff` | `#a78bfa` |
| Doctor | `#059669` | `#34d399` | `#6ee7b7` | `#ecfdf5` | `#34d399` |
| Enfermería | `#d97706` | `#fbbf24` | `#fcd34d` | `#fffbeb` | `#fbbf24` |
| Paciente | `#2563eb` | `#60a5fa` | `#93c5fd` | `#eff6ff` | `#60a5fa` |

Cada rol define: `--color-<rol>`, `--color-<rol>-light`, `--color-<rol>-soft`, `--color-<rol>-bg`, `--color-<rol>-surface`, `--gradient-<rol>`.

### 8.2 Estados de citas

| Estado | Color | Fondo |
|--------|-------|-------|
| Pendiente | `#f59e0b` | `#fffbeb` |
| Confirmado | `#10b981` | `#ecfdf5` |
| Completado | `#3b82f6` | `#eff6ff` |
| Cancelado | `#ef4444` | `#fef2f2` |
| No-show | `#6b7280` | `#f3f4f6` |

### 8.3 Efectos visuales de la plataforma
- **Burbujas animadas:** `.has-animated-bg::after` con `radial-gradient` en 3 posiciones, animación `float` 20s infinite.
- **Burbujas individuales:** `.bubble-1` a `.bubble-4` con tamaños 100–300px, delays escalonados, blur 1px.
- **Transiciones:** `--transition-smooth: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`, aplicado a `theme-transition` y descendientes.
- **Scrollbar:** Thumb con `--color-patient-soft`, hover con `--color-patient`.
- **Entrada de app:** `#root { animation: fadeIn 0.5s ease; }`

---

## 9. Breakpoints y responsive

### Sitio promocional
| Breakpoint | Condición | Cambios principales |
|------------|-----------|---------------------|
| Desktop | ≥ 769px | Navbar con enlaces visibles, menú móvil oculto, carrusel con flechas, grids multi-columna |
| Tablet | 481px – 768px | Navbar: toggle visible, enlaces ocultos, menú móvil disponible; hero título `fs-4xl`; grids 1-2 columnas; carrusel sin flechas |
| Móvil | ≤ 480px | Navbar altura 60px; hero `clamp(480px, 80vh, 600px)`; grids 1 columna; carrusel `clamp(240px, 40vh, 320px)`; texto hero más pequeño |

### Frontend de plataforma
| Breakpoint | Condición |
|------------|-----------|
| Tablet | ≤ 768px (`html font-size: 93.75%` → 15px) |
| Móvil | ≤ 480px (`html font-size: 87.5%` → 14px) |
| Grid responsive | `repeat(auto-fit, minmax(clamp(250px, 80vw, 350px), 1fr))` |

---

## 10. Archivos clave y convención para futuros proyectos

### Archivos de referencia obligatorios al iniciar un nuevo frontend del proyecto

```
src/index.css              # Reset global, tipografía base, botones, inputs, scrollbar, skip link
src/styles/theme.css       # Tokens de tema (plataforma) o src/sitioPromocional/styles/tokens.css (promo)
src/styles/components-responsive.css # Componentes responsivos (plataforma)
src/sitioPromocional/styles/primitives.css # Utilitarias (promo)
src/sitioPromocional/styles/promocional.css # Reglas por componente (promo)
src/sitioPromocional/styles/promo-responsive.css # Breakpoints toggles (promo)
```

### Reglas de oro para mantener coherencia

1. **Nunca usar valores mágicos sueltos.** Siempre referencia un token CSS (`--promo-*` o variable de tema).
2. **Z-index controlado.** Usar la escala definida en `tokens.css` (navbar 2100, toggles 2000, menú 1100, skip link 9999). No usar `9999` genérico salvo skip link.
3. **Imágenes:** `display: block; max-width: 100%; height: auto;` en `img, svg`. Usar `object-fit: cover` cuando sea necesario. Lazy loading con `loading="lazy"` y `decoding="async"`.
4. **Transiciones:** Usar `--promo-ease` y duraciones definidas (`fast` 150ms, `base` 250ms, `slow` 400ms). Respetar `prefers-reduced-motion`.
5. **Tema oscuro:** Siempre definir el par claro/oscuro en el mismo bloque de variables.
6. **Accesibilidad:** Siempre incluir skip link, focus-visible con `2px solid`, `aria-*` en componentes interactivos, y `scroll-margin-top` en secciones ancladas bajo navbar fijo.
7. **Menú móvil:** Usar `position: fixed` con `top: var(--navbar-height)`, `bottom: auto`, `height: calc(100dvh - var(--navbar-height))`, `overflow-y: auto`, `overscroll-behavior: contain`. Nunca `inset: ... 0 0 0` anidado en otro fixed (colapsa en Chromium al hacer scroll).

---

## 11. Historial de cambios relevantes (UI/UX)

| Fecha | Cambio | Archivo | Motivo |
|-------|--------|---------|--------|
| 2026-11-09 | Menú móvil: `inset: 64px 0 0 0` → `top/left/right/bottom: auto` + `height: calc(100dvh - var(--navbar-height))` | `promocional.css`, `tokens.css` | El menú colapsaba a 64px al abrirse tras scroll (fixed anidado en fixed). Ahora dimensiones estables en todas las secciones. |
| 2026-11-09 | Gestor de scroll por ruta (`ScrollManager` + `useScrollManager`) | `ScrollManager.jsx`, `useScrollManager.js`, `App.jsx` (ambos frontends) | PUSH→top, POP→restore, hash→ancla, carga directa→top. |
| 2026-11-09 | Navbar móvil z-index: 999→1100, navbar 1000→2100, escala de z-index documentada | `promocional.css`, `tokens.css` | El menú quedaba bajo toggles flotantes (2000) y skip link (9999). |

---

*Documento generado como referente de UI/UX para el proyecto Gestion-Saude. Conservar junto al resto de archivos de información del proyecto para futuros desarrollos y nuevos frontends.*