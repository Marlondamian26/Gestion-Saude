# Promo Frontend — Sitio Promocional Independiente

Proyecto React + Vite independiente para el sitio promocional de **Consultório Dra. Belkis Morejón Acosta**.

## Stack

- React 19 + Vite 7
- react-router-dom 7
- react-icons 5
- Vitest + Testing Library
- Playwright (E2E)

## Scripts

```bash
npm run dev        # Servidor de desarrollo en http://localhost:5174
npm run build      # Build de producción
npm run test       # Tests unitarios (Vitest)
npm run test:e2e   # Tests E2E (Playwright)
npm run preview    # Preview del build
```

## Estructura

```
src/
├── sitioPromocional/
│   ├── components/     # Componentes de sección (Hero, Carousel, Navbar, etc.)
│   ├── styles/         # CSS (tokens.css, primitives.css, promocional.css, promo-responsive.css)
│   ├── hooks/          # Hooks personalizados (useInView, usePrefersReducedMotion)
│   ├── config/         # constants.js (datos de clínica, URLs, servicios)
│   ├── context/        # LanguageContext, ThemeContext
│   └── __tests__/      # Tests unitarios
├── context/            # Traducciones (promo.js)
├── utils/              # apiUtils.js, syncPreferences.js
└── main.jsx            # Entry point
```

## Sistema de diseño

Documentación completa en [`docs/design-system.md`](./docs/design-system.md).

- **Tokens:** `src/sitioPromocional/styles/tokens.css`
- **Primitivas:** `src/sitioPromocional/styles/primitives.css`
- **Fuentes:** Fraunces (display) + Inter (cuerpo) via Google Fonts

## Sincronización con la plataforma

El promo mantiene sincronización cross-origen con la plataforma principal (`frontend/`):

- **Idioma:** query param `?lang=` en URLs
- **Tema:** query param `?theme=` en URLs
- **Sync:** al hacer clic en "Entrar" o "Registrarse", los params se propagan a la plataforma

Ver [`docs/architecture/cross-origin-sync.md`](../docs/architecture/cross-origin-sync.md) para detalles del contrato.

## Accesibilidad

- Skip link + focus visible global
- `role="region"` + `aria-labelledby` en secciones principales
- `aria-live="polite"` en carousel
- `prefers-reduced-motion` respetado
- Navegación por teclado en navbar y carousel

## Tests

- **Unitarios:** `npm run test` (Vitest + RTL)
- **E2E:** `npm run test:e2e` (Playwright)
- **Coverage:** `npm run test:coverage`

## Despliegue

- **Dominio:** `https://mis-proyectos.onrender.com` (o configurado en Render)
- **Backend:** `https://gestion-saude-backend.onrender.com`
- **Variables de entorno:** ver `.env.example`

## Documentación visual

- [`docs/design/`](./docs/design/) — Capturas before/after del rediseño FASE 10
- [`docs/design-system.md`](./docs/design-system.md) — Sistema de diseño completo
