# Diseño — FASE 10

Capturas de referencia visual del rediseño del sitio promocional.

## Estructura

```
docs/design/
├── before/           # Estado inicial (12 capturas)
│   ├── promo-full-light-pt-mobile.png
│   ├── promo-full-light-pt-desktop.png
│   ├── promo-full-light-es-mobile.png
│   ├── promo-full-light-es-desktop.png
│   ├── promo-full-light-en-mobile.png
│   ├── promo-full-light-en-desktop.png
│   ├── promo-full-dark-pt-mobile.png
│   ├── promo-full-dark-pt-desktop.png
│   ├── promo-full-dark-es-mobile.png
│   ├── promo-full-dark-es-desktop.png
│   ├── promo-full-dark-en-mobile.png
│   └── promo-full-dark-en-desktop.png
├── after/            # Estado final (12 capturas)
│   ├── promo-full-light-pt-mobile.png
│   ├── promo-full-light-pt-desktop.png
│   ├── promo-full-light-es-mobile.png
│   ├── promo-full-light-es-desktop.png
│   ├── promo-full-light-en-mobile.png
│   ├── promo-full-light-en-desktop.png
│   ├── promo-full-dark-pt-mobile.png
│   ├── promo-full-dark-pt-desktop.png
│   ├── promo-full-dark-es-mobile.png
│   ├── promo-full-dark-es-desktop.png
│   ├── promo-full-dark-en-mobile.png
│   └── promo-full-dark-en-desktop.png
└── README.md         # Este archivo
```

## Cómo generar las capturas

```bash
# Before (estado inicial)
npx playwright test e2e/baseline.spec.js

# After (estado final)
npx playwright test e2e/after-screenshots.spec.js
```

## Comparativa

Cada pareja `before/` + `after/` compara la misma combinación de tema × idioma × viewport.

### Combinaciones capturadas

| Tema  | Idioma | Mobile (390px) | Desktop (1440px) |
|-------|--------|----------------|------------------|
| Light | PT     | before / after | before / after   |
| Light | ES     | before / after | before / after   |
| Light | EN     | before / after | before / after   |
| Dark  | PT     | before / after | before / after   |
| Dark  | ES     | before / after | before / after   |
| Dark  | EN     | before / after | before / after   |

## Notas

- Capturas generadas con Playwright en Chromium.
- `animations: 'disabled'` para consistencia.
- `fullPage: true` para capturar el sitio completo.
