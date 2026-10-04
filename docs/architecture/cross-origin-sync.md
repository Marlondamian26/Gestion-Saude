# Estrategia de Sincronización Cross-Origin (FASE 9 §9.0.3)

## Problema

`belkis-saude-promo.onrender.com` y `gestion-saude-frontend.onrender.com` son orígenes distintos. Los siguientes mecanismos **NO funcionan** entre subdominios de `*.onrender.com`:

| Mecanismo | Razón de bloqueo |
|---|---|
| `localStorage` / `sessionStorage` | Same-origin policy estricta. `onrender.com` está en la Public Suffix List → no se permite `document.domain = 'onrender.com'` ni cookies de tercer nivel. |
| Cookies cross-subdomain | Bloqueadas por navegadores modernos cuando el dominio raíz está en la Public Suffix List. |
| `BroadcastChannel` | Same-origin only. |
| `postMessage` | Requiere que ambas pestañas estén abiertas simultáneamente y conocer URLs. Frágil y no persistente. |

## Solución: URL params + localStorage local

```mermaid
flowchart TD
    subgraph Browser
        A[Promo: localhost:5174] -->|click "Entrar"| B[Construye URL con ?lang=X&theme=Y]
        B --> C[Redirige window.location.href]
        C --> D[Plataforma: localhost:5173/login?lang=X&theme=Y]
        D --> E[Bootstrap: readFromUrl lee lang y theme]
        E --> F[Aplica a localStorage local y al contexto]
        F --> G[history.replaceState limpia la URL]
        G --> H[Plataforma ya cargada en X/Y]
    end

    subgraph Reverse
        I[Plataforma: localhost:5173] -->|click "Ver sitio"| J[Construye URL con ?lang=X&theme=Y]
        J --> K[Redirige window.location.href]
        K --> L[Promo: localhost:5174/?lang=X&theme=Y]
        L --> M[main.jsx: readFromUrl antes de providers]
        M --> N[Aplica a localStorage local y al contexto]
        N --> O[history.replaceState limpia la URL]
        O --> P[Promo ya cargada en X/Y]
    end
```

### Algoritmo de arranque (cada frontend)

1. **URL params:** leer `lang` y `theme` de `URLSearchParams`.
2. **Si presentes:** aplicar inmediatamente al contexto + persistir en `localStorage` local.
3. **Limpiar la URL:** `history.replaceState` para eliminar los params (no recargar).
4. **Si no hay params:** leer de `localStorage` local.
5. **Si no hay localStorage:** detectar `navigator.language` (idioma) y `prefers-color-scheme` (tema).

### Valores válidos

- **Idioma:** `pt`, `es`, `en`
- **Tema:** `light`, `dark`, `auto`

### Dónde se ejecuta `readFromUrl()`

- **Promo-frontend:** en `src/main.jsx`, llamado **antes** de montar los providers, para que los contextos arranquen con los valores correctos.
- **Plataforma:** en `LanguageContext.jsx` y `ThemeContext.jsx`, dentro del `useState` initializer y el `useEffect` de inicialización.

### Construcción de URLs al navegar

- **Promo → Plataforma:** `buildPlatformUrl(PLATFORM_URL, { language, theme })` en los componentes Navbar, Hero, CTA, Footer.
- **Plataforma → Promo:** `buildPromoUrl(VITE_PROMO_URL, { language, theme })` en `PromocionalToggle.jsx`.

## Limitaciones

1. **Sin sync en tiempo real entre pestañas:** si el usuario tiene ambos sitios abiertos en pestañas separadas y cambia el idioma en uno, el otro no se actualiza hasta que navegue entre ellos (con URL params). Este es un comportamiento inherente al cross-origin sin cookies compartidas.
2. **Solo propagación por navegación:** el estado viaja cuando hay un clic que dispara `window.location.href` o `window.location.assign()` con params. No hay mecanismo pasivo de actualización.
3. **El modo `auto` respeta `prefers-color-scheme` local:** si el sistema cambia de light a dark, cada sitio reacciona independientemente (evento `change` en `matchMedia`). Esto es el comportamiento deseado.

## Implementación (FASE 9 §9.5–§9.6)

### Utilities compartidas

**`syncPreferences.js`** (en ambos proyectos: `promo-frontend/src/utils/` y `frontend/src/utils/`)

| Función | Parámetros | Descripción |
|---|---|---|
| `readFromUrl()` | — | Lee `?lang=` y `?theme=` de la URL, los persiste en `localStorage` local, limpia la URL via `history.replaceState`. Devuelve `{ language?, theme? }`. |
| `buildPlatformUrl(baseUrl, opts)` | `baseUrl: string`, `opts: { language?, theme? }` | Construye una URL absoluta de la plataforma con params de sync. |
| `buildPromoUrl(baseUrl, opts)` | `baseUrl: string`, `opts: { language?, theme? }` | Análoga a `buildPlatformUrl` para el sitio promo. |

**`storage.js`** (en ambos proyectos: `promo-frontend/src/utils/` y `frontend/src/utils/`)

| Función | Descripción |
|---|---|
| `safeStorage.getItem(key, fallback)` | Read SSR-safe de `localStorage`. |
| `safeStorage.setItem(key, value)` | Write SSR-safe de `localStorage`. |
| `safeStorage.removeItem(key)` | Remove SSR-safe de `localStorage`. |
| `readLanguage()` / `writeLanguage(lang)` | Helpers para `language`. |
| `readTheme()` / `writeTheme(theme)` | Helpers para `theme`. |
| `readThemeAutomatic()` / `writeThemeAutomatic(isAuto)` | Helpers para `theme-automatic`. |

### Contextos actualizados

**`LanguageContext.jsx`** (ambos proyectos):
- `detectInitialLanguage()` llama `readFromUrl()` primero (lee de URL → localStorage).
- Si no hay params, cae a `readLanguage()` (localStorage).
- Si no hay localStorage, detecta desde `navigator.language`.
- Al cambiar idioma (`setLanguage`), el `useEffect` persiste en `localStorage` via `writeLanguage()`.

**`ThemeContext.jsx`** (ambos proyectos):
- `detectInitialTheme()` usa `readTheme()` en vez de `localStorage.getItem('theme')`.
- El `useEffect` de aplicación usa `writeTheme()` y `writeThemeAutomatic()`.
- En `setThemeAutomatic()`, usa `writeTheme('auto')`.

### Componentes de navegación

- **Promo → Plataforma:** `Navbar.jsx`, `Hero.jsx`, `CTA.jsx`, `Footer.jsx` usan `buildPlatformUrl(PLATFORM_URL, { language, theme: themeParam })`.
- **Plataforma → Promo:** `PromocionalToggle.jsx` usa `buildPromoUrl(VITE_PROMO_URL, { language, theme: themeParam })`.

## Mejora futura (no obligatoria)

Endpoint backend `GET/PUT /api/preferencias/` para persistir `{language, theme}` por usuario. Permitiría sync perfecto entre dispositivos, pero requiere autenticación. La solución actual funciona **sin autenticación**, cumpliendo el requisito del proyecto.
