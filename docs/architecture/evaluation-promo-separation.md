# Evaluación: Separación y Rediseño del Sitio Promocional

**Fecha:** 2026-10-04  
**Contexto:** La separación arquitectónica del sitio promocional del bundle principal de la plataforma.

## 1. Baseline actual

### 1.1 Bundle del sitio promocional dentro del bundle compartido

**Build actual (`npm run build`):**

| Archivo | Tipo | Tamaño | Gzip |
|---|---|---|---|
| `index-B5vBMchE.js` | App shell (eager) | 333.11 KB | 101.18 KB |
| `vendor-router-_SQJwgJu.js` | Modulepreload (eager) | 46.87 KB | 16.58 KB |
| `vendor-util-C0ugCn4D.js` | Modulepreload (eager) | 59.08 KB | 21.28 KB |
| `index-LcJd59no.css` | App shell CSS (eager) | 24.56 KB | 5.39 KB |
| `LandingWrapper-CcA0mp0G.js` | Promo (lazy chunk) | 20.86 KB | 5.48 KB |
| `LandingWrapper-Bws2Re9f.css` | Promo CSS (lazy) | 19.92 KB | 3.90 KB |

### 1.2 Análisis

- **Bundle inicial que descarga un visitante anónimo en `/`:** 439.06 KB JS (gzip: 143.12 KB) + 24.56 KB CSS (gzip: 5.39 KB)
- **Contenido promocional (LandingWrapper chunk):** 20.86 KB JS (5.48 KB gzip) + 19.92 KB CSS (3.90 KB gzip)
- **Porcentaje de JS que es exclusivamente promocional:** 20.86 / 439.06 ≈ **4.8%**
- **El resto (~95% del JS inicial)** es el "app shell": 4 contextos (LanguageContext 2015 líneas, AuthContext, NotificacionesContext con SSE, ThemeContext), ErrorBoundary, servicios (axios, auth, chatService), y referencias a rutas lazy (Dashboard, Citas, etc.).

### 1.3 Problema

Aunque FASE 7 §7.2 implementó lazy loading (components Dashboard, ChatIA, Citas, etc. en chunks separados), **el app shell principal (333 KB) incluye contextos que el visitante anónimo del promo no necesita**:

| Contexto/Componente | Necesario para promo | Tamaño estimado |
|---|---|---|
| LanguageContext (2015 líneas, todo PT/ES/EN) | Solo `promo_*` subset | ~86 KB source → ~22 KB minified |
| AuthContext | NO | ~3 KB |
| NotificacionesContext (SSE + EventSource) | NO | ~15 KB |
| ThemeContext | SÍ | ~2 KB |
| ErrorBoundary | Sí (pero versión lighter) | ~1 KB |
| axios, date-fns, jwt-decode | NO | ~15 KB |
| index.css + App.css + components-responsive.css | Parcialmente | ~25 KB |

### 1.4 Objetivo medible

| Métrica | Baseline | Objetivo post-FASE 8 |
|---|---|---|
| Bundle inicial promo | ~439 KB (JS+gzip ineficiente) | ≤120 KB gzip |
| LandingWrapper JS | 20.86 KB | ~25 KB (con rediseño visual) |
| LCP | Sin medir (compartido) | <2.5s Fast 3G |
| Chunks del dashboard en bundle promo | Sí (439 KB) | 0 |

## 2. Alternativas evaluadas

| Opción | Pros | Contras | Veredicto |
|---|---|---|---|
| **A) Monorepo con `frontend/` + `promo/`** (dos proyectos Vite) | Separación real, despliegues independientes, packages compartidos vía workspace | Duplicación de dependencias, `node_modules` duplicado, config duplicada | ❌ Requiere más mantenimiento |
| **B) Monorepo con 2 entry points Vite** (`vite.config.js` + `vite.config.promo.js`) | Un solo `package.json`, `node_modules` compartido, builds separados, compartición opcional de contextos | Riesgo de contaminación si no se separa bien los imports; comparte `node_modules` | ✅ **RECOMENDADO** |
| **C) Repositorios separados** | Máxima independencia | Duplicación de CI, contextos, versiones de dependencias; sincronización manual | ❌ Overkill para este team |
| **D) Micro-frontend (Module Federation)** | Independencia total, runtime sharing | Complejidad muy alta; Vite no lo soporta nativamente, requiere Webpack 5 + MF plugin | ❌ Descartado |

### Decisión

**Opción B: 2 entry points Vite en el mismo monorepo.**

Justificación:
1. Permite un bundle independente sin duplicar `node_modules` ni `package.json`.
2. Los contextos (`LanguageContext`, `ThemeContext`) se comparten por referencia; Vite tree-shakea lo que cada entry no usa.
3. Los scripts `build` y `build:promo` producen `dist/` y `dist-promo/` separados.
4. El `LanguageContext` se mantiene como fuente única de verdad, pero el promo solo importa `tPromo` (que lee del namespace `promo_*`); el resto de las traducciones (plataforma) se tree-shakea fuera.

## 3. Estructura objetivo

```
frontend/
├── index.html                     # entry plataforma (existente)
├── promo.html                     # NUEVO entry promocional
├── vite.config.js                 # config plataforma (existente)
├── vite.config.promo.js           # NUEVO config promo → dist-promo
├── package.json                   # + scripts dev:promo, build:promo
├── .env.example                   # + VITE_PLATFORM_URL
├── src/
│   ├── main.jsx                   # entry plataforma (existente)
│   ├── promo-main.jsx             # NUEVO entry promocional
│   ├── App.jsx                    # plataforma (modificado: quita rutas promo)
│   ├── PromoApp.jsx               # NUEVO root promo (aislado, solo Routes)
│   ├── context/                   # ThemeContext, LanguageContext (compartidos)
│   │   └── LanguageContext.jsx    # purga imports si importa algo no-promo
│   ├── utils/apiUtils.js          # compartido (wakeUpBackend, getApiUrl)
│   ├── sitioPromocional/
│   │   ├── App.jsx                # NUEVO (eliminando huérfano sitioPromocional.jsx raíz)
│   │   ├── components/            # 9 componentes (LandingWrapper, Navbar, etc.)
│   │   ├── config/
│   │   │   └── constants.js       # + VITE_PLATFORM_URL
│   │   └── styles/
│   │       ├── promo-tokens.css   # NUEVO (sistema de tokens)
│   │       ├── promocional.css    # rediseñado
│   │       └── promo-responsive.css
│   └── components/
│       ├── PromocionalToggle.jsx  # refactorizado (redirect externo)
│       ├── ThemeToggle.jsx        # dashboard (reutilizado por promo, §8.8)
│       └── LanguageToggle.jsx     # dashboard (reutilizado por promo, §8.8)
└── render.yaml                    # + static site Gestion-Saude-promo
```

## 4. Riesgos de la separación

| Riesgo | Mitigación |
|---|---|
| `LanguageContext` importa algo del dashboard | Auditar imports (§8.2.1) |
| `data-theme` no se aplica en promo | PromoApp incluye ThemeProvider; verifica `document.documentElement.setAttribute` |
| localStorage compartido en dev (localhost) | OK en dev; en prod son dominios distintos → independencia deseada |
| CORS bloquea imágenes de `/sitio-imagenes/` desde dominio promo | Añadir dominio promo a `CORS_ALLOWED_ORIGENS` en Render |
| `PromocionalToggle` navega con `useNavigate` → roto en promo | Cambiar a `window.location.href` (redirect externo) |
| Entry punto raíz `sitioPromocional.jsx` huérfano | Eliminar (importa de `./src/sitioPromocional/App` que no existe) |
