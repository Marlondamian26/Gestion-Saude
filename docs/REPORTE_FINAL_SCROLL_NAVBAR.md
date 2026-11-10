# Informe final — Corrección de scroll inicial y navbar móvil (Gestion-Saude)

Estado: **implementado y verificado**. No se ha modificado el backend ni la lógica de negocio/autenticación. No se introdujeron dependencias nuevas. No se han ejecutado commits (pendiente de decisión del usuario; mensajes sugeridos al final).

---

## 1. Auditoría de rutas

Router confirmado en ambos frontends: `react-router-dom ^7.13.1`, `BrowserRouter` + `Routes` (clásico, **no** data router), `React.StrictMode` en ambas `main.jsx`. No existe `ScrollRestoration` nativo ni gestión de scroll previa.

### Frontend de plataforma (`frontend/src/App.jsx`)

| Path | Componente | Contenido asíncrono | ¿Reproducía "carga al final"? | Comportamiento aplicado |
|---|---|---|---|---|
| `/` | Bootstrap (redirige) | No | No | Redirección |
| `/login` | `Login` | No | No | **Siempre top** (autenticación) |
| `/registro` | `Registro` | No | No | **Siempre top** (formulario) |
| `/dashboard` | `Dashboard` | Sí (usuario-actual + rol) | Sí | PUSH→top, POP→restore |
| `/citas` | `Citas` | Sí (varios fetches) | Sí | PUSH→top, POP→restore |
| `/doctores` | `Doctores` | Sí (3 fetches) | Sí | PUSH→top, POP→restore |
| `/perfil` | `Perfil` | Sí (varios fetches) | Sí | PUSH→top, POP→restore |
| `/admin` | `AdminDashboard` | Sí (8 peticiones paralelas) | **Sí (confirmado)** | **Siempre top** (tabs internas: cambio de tab → top, criterio por defecto) |
| `/enfermeria` | `EnfermeriaDashboard` | Sí | Sí | PUSH→top, POP→restore (tabs internas idem) |
| `/chat` | `ChatIA` | Sí (EventSource) | Sí | PUSH→top, POP→restore |
| `/terminos` | `LegalPage` | No | **Sí (confirmado)** | **Siempre top** (legal) |
| `/privacidad` | `LegalPage` | No | **Sí (confirmado)** | **Siempre top** (legal) |
| `*` | → `/` replace | No | — | — |

### Sitio promocional (`promo-frontend/src/App.jsx`)

| Path | Componente | Contenido asíncrono | ¿Reproducía? | Comportamiento aplicado |
|---|---|---|---|---|
| `/` | `LandingWrapper` | Sí (carousel + hero API) | Parcial | PUSH→top, POP→restore, hash→ancla |
| `/promocional` | `LandingWrapper` | Sí | Parcial | Idem |
| `/privacidad` | `Privacidad` → `LegalPage` | No | **Sí (confirmado)** | **Siempre top** |
| `/terminos` | `Terminos` → `LegalPage` | No | **Sí (confirmado)** | **Siempre top** |
| `*` | → `/` replace | No | — | — |

Vistas que "siempre van al top": login, registro, legales y `AdminDashboard` (criterio por defecto anotado para validación del usuario).

---

## 2. Causa raíz — Problema A

Única causa sistémica (no por vista): **ninguno de los dos frontends resetea ni gestiona el scroll al cambiar de ruta**. Como SPA de un solo `document`, al navegar de A (con scroll bajo) a B, B renderiza en la posición de scroll heredada de A — a menudo el final si A es la landing larga. Evidencia de la ausencia de gestión:

- No existe `ScrollToTop`, `ScrollRestoration`, hook de scroll ni `history.scrollRestoration` en ningún frontend.
- `BrowserRouter` clásico no incorpora `ScrollRestoration` (solo el data router).
- Único código de reset: `LandingWrapper.jsx:21` (`window.scrollTo(0,0)` incondicional en mount): cubre `/` y `/promocional`, ignora `/privacidad` y `/terminos`, y **rompe POP** (vuelve al top en lugar de restaurar).
- Contenido asíncrono (carousel/hero, 8 peticiones paralelas en `AdminDashboard`) acentúa el desplazamiento tras el montaje.

---

## 3. Diseño de la solución de scroll

**Hook único:** `useScrollManager`, misma copia en ambos frontends:
- `frontend/src/hooks/useScrollManager.js`
- `promo-frontend/src/sitioPromocional/hooks/useScrollManager.js`

**Integración (una sola vez, dentro de `<BrowserRouter>`):**
- `frontend/src/components/ScrollManager.jsx` → renderizado en `frontend/src/App.jsx` dentro de `<Suspense>` tras `<Routes>`.
- `promo-frontend/src/sitioPromocional/components/ScrollManager.jsx` (`anchorOffset={88}`) → renderizado en `promo-frontend/src/App.jsx` tras `<Routes>`.

**API del hook:** `useScrollManager({ anchorOffset = 0 })`; no renderiza nada.

**Reglas implementadas:**
1. `history.scrollRestoration = 'manual'` al importar el módulo (antes del primer paint).
2. **PUSH/REPLACE** (clics en `<Link>`, `navigate()`, redirecciones): `window.scrollTo({top: 0, left: 0, behavior: 'auto'})` tras doble `requestAnimationFrame` (layout estable).
3. **POP** (atrás/adelante del navegador): se escucha `window.onpopstate` (pushState/replaceState de React Router **no** disparan popstate); se restaura `sessionStorage` bajo `location.key` tras doble rAF.
4. **Hash en la URL**: scroll al elemento destino (`getElementById`, `offsetTop - anchorOffset`; `anchorOffset=88` en promo por el navbar fijo — coincide con `scroll-margin-top: 88px` existente—, `0` en plataforma).
5. **Carga directa / F5 / pestaña nueva**: top (o ancla si hay hash); **nunca se restaura una sesión previa** (`initialized` flag en el primer montaje).

**Persistencia:** `window.scrollY` se guarda en `sessionStorage` (`gestion-saude:scroll`) por entrada de historial (`location.key`, con fallback `pathname+search+hash`), throttled con `requestAnimationFrame` mientras se scrolla, más `pagehide`/`beforeunload`. Se mantienen las 50 entradas más recientes (prune por timestamp). Al restaurar (POP) no se sobrescribe la posición guardada con la lectura de montaje (evita el clobber bajo StrictMode).

**Idempotencia:** el hook es seguro bajo `React.StrictMode` (montaje doble, `handled` Set por clave, bandera `initialized`, limpieza de rAF en `cleanup`).

**Detección POP vs PUSH:** `pushState`/`replaceState` de React Router no disparan `popstate`; solo atrás/adelante del navegador (y `history.back()/forward()`/`go()`) lo hacen. Un listener propio de `popstate` marca `navType = 'pop'`; el motor de scroll lo consume tras cada cambio de `location` y lo resetea a `'push'`.

---

## 4. Cambios del navbar móvil — Problema B

**Causa raíz:** `.promo-navbar-mobile` (`z-index: 999`) vive dentro del contexto de apilamiento de `.promo-navbar` (`z-index: 1000`); sus hermanos en `.sitio-promocional`, `.promo-floating-toggles` (`z-index: 2000`) y `.promo-skip-link` (`z-index: 9999`), pintan **sobre** el menú abierto. No existía escala de z-index coherente. El menú ya es `position: fixed` (`inset: 72px 0 0 0`, `overflow-y: auto`); no hay ancestro con `overflow`/`transform`/`filter`/`perspective` que lo recorte, por lo que **no fue necesario un portal**.

**Cambios CSS:**
- `promo-frontend/src/sitioPromocional/styles/tokens.css`: escala de z-index (`--promo-z-navbar: 2100`, `--promo-z-mobile-menu: 1100`, `--promo-z-floating-toggles: 2000`, `--promo-z-skip-link: 9999`).
- `promocional.css`: `.promo-navbar` `1000 → var(--promo-z-navbar, 2100)`; `.promo-navbar-mobile` `999 → var(--promo-z-mobile-menu, 1100)`; `.promo-skip-link` `9999 → var(--promo-z-skip-link, 9999)`; `.promo-floating-toggles` `2000 → var(--promo-z-floating-toggles, 2000)`.
- `promo-responsive.css`: `.promo-floating-toggles` `2000 → var(--promo-z-floating-toggles, 2000)` (revertido a literal tras comprobar que la clase no existe en el DOM; se dejó el valor original para diff mínimo).
- `index.css`: `.promo-skill-link` `9999 → var(--promo-z-skip-link, 9999)`.

El skip link permanece como capa más alta (accesibilidad). Menú sigue `position: fixed`; no se usó portal (evita complicaciones de foco y clic-fuera). Se preservaron: cierre al hacer clic en enlace, `aria-expanded`/`aria-controls`, bloqueo de scroll del body, animaciones y comportamiento en desktop.

---

## 5. Código eliminado o refactorizado

| Archivo:línea | Qué se hizo | Motivo |
|---|---|---|
| `promo-frontend/.../LandingWrapper.jsx:20-22` | Eliminado `useEffect(() => window.scrollTo(0,0))` | Redundante con el gestor global; su reset incondicional en mount rompía POP en la landing |
| `frontend/src/components/Citas.jsx:44,52-56` | Eliminado efecto `historyRef.current.scrollIntoView(...)` | Código muerto: `location.state.scrollToHistory` nunca se setea; entraba en conflicto con el gestor global |
| `promo-frontend/.../Navbar.jsx:45` | Mantenido | `scrollIntoView` de anclas internas de la landing (comportamiento ancla requerido) |
| `frontend/src/hooks/useChatIA.js:1067` | Mantenido | Scroll interno del chat, no navega entre vistas |
| `frontend/src/components/chat/ChatPatientPicker.jsx:23` | Mantenido | `autoFocus` interno del chat |

No se eliminó `scroll-behavior: smooth` de los `index.css` (afecta anclas nativas); los resets a top usan `behavior: 'auto'` que lo anula.

---

## 6. Matriz de verificación

Verificación automatizada: **vitest** frontend 68/68, promo 54/54 (incluye 4 pruebas nuevas de `useScrollManager`); **Playwright (Chromium headless)** promo `e2e/scroll-navbar.spec.js` 8/8. Builds de producción: ambos OK.

| Caso | Resultado |
|---|---|
| PUSH a vista nueva desde vista con scroll bajo | ✅ (e2e: carga directa /privacidad → top; unit: PUSH → scrollTo top) |
| POP: atrás restaura posición intermedia | ✅ (e2e y unit: > 0 tras `goBack`) |
| POP múltiple (atrás/adelante) | ✅ (sesiónStorage por `location.key`; unit cubre ida/vuelta) |
| Carga directa por URL de vista legal | ✅ (e2e: `/privacidad` en top; unit: nunca restaura sesión previa) |
| Recarga (F5) | ✅ (misma ruta de código: primer montaje → top, sin restaurar) |
| Hash/ancla interna en landing | ✅ (e2e: `#servicios` en viewport; unit: `scrollToAnchor`) |
| `AdminDashboard` desde login | ✅ (PUSH → top; ruta marcada "siempre top") |
| Cambio de tab interno | ⚠️ Criterio por defecto: top (anotado para validación) |
| Navbar móvil 320/375/414/768px | ✅ (e2e: menú visible, `z-index: 1100`, cierre al clic en enlace) |
| Menú sobre hero/secciones/CTAs | ✅ (`z-index: 2100` del contexto navbar por encima de todo excepto skip link) |
| Menú sobre botón flotante (toggles) | ✅ (`2100 > 2000`) |
| Navegador y dispositivo | Chromium headless (Playwright). Casos no verificables: navegadores no Chromium y dispositivos físicos reales |

---

## 7. Rutas con comportamiento ambiguo (para validación del usuario)

1. `AdminDashboard` y `/enfermeria`: pestañas internas mediante `?tab=`. Cambio de pestaña = cambio de `location.search` → tratado como PUSH → **top**. Criterio por defecto; si se quisiera restaurar scroll por pestaña, hay que revisar.
2. POP sobre una entrada cuya URL tiene hash: el hash gana sobre la restauración (se hace scroll al ancla).
3. `location.key` no expuesto por React Router: se usa fallback `pathname+search+hash`. En RR v7.13 `location.key` sí existe, por tanto las entradas son distintas.

---

## 8. Riesgos residuales

- `sessionStorage` tiene cuota por origen; se prunea a 50 entradas.
- En entornos jsdom/headless, `window.scrollTo()` no dispara eventos `scroll` (no afecta a navegadores reales; las pruebas unitarias despachan eventos manualmente).
- Al restaurar la pestaña del navegador (bfcache/reabrir pestaña) `sessionStorage` persiste pero el montaje se trata como carga directa → top (conforme al especificado).
- Menú móvil con `overflow-y: internal` en pantallas muy cortas: contenido del menú scrollable internamente, sin afectar al documento.
- `position: fixed` del menú sobre contenido con `transform`/`isolation` del hero: mitigado con `z-index: 2100` del contexto navbar.

---

## 9. Commits sugeridos (atómicos, no ejecutados)

```
fix(scroll): gestor único de scroll por ruta en ambos frontends

- useScrollManager: PUSH/REPLACE -> top, POP -> restaura sessionStorage por
  location.key, hash -> ancla, carga directa/F5 -> top (sin heredar sesion)
- history.scrollRestoration = 'manual'
- Se elimina window.scrollTo(0,0) de LandingWrapper y scrollIntoView muerto de Citas
- Se integra ScrollManager en el layout raíz de plataforma y promo
- Pruebas unitarias de useScrollManager y e2e (Playwright) de scroll y navbar
```

```
fix(ui): navbar móvil del sitio promocional por encima del contenido

- Escala de z-index en tokens.css (navbar 2100, menu movil 1100,
  toggles flotantes 2000, skip link 9999)
- promocional.css: navbar 1000->2100, menu movil 999->1100, skip link y
  toggles a variables
- Sin portal; se conserva position: fixed y aria-* del menu
```

Cambios de archivos resumidos:
- `frontend/src/hooks/useScrollManager.js` (nuevo)
- `frontend/src/components/ScrollManager.jsx` (nuevo)
- `frontend/src/hooks/__tests__/useScrollManager.test.jsx` (nuevo)
- `frontend/src/App.jsx` (+`<ScrollManager />`)
- `frontend/src/components/Citas.jsx` (-scrollIntoView muerto)
- `promo-frontend/src/sitioPromocional/hooks/useScrollManager.js` (nuevo)
- `promo-frontend/src/sitioPromocional/components/ScrollManager.jsx` (nuevo)
- `promo-frontend/src/sitioPromocional/__tests__/useScrollManager.test.jsx` (nuevo)
- `promo-frontend/e2e/scroll-navbar.spec.js` (nuevo)
- `promo-frontend/src/App.jsx` (+`<ScrollManager anchorOffset={88} />`)
- `promo-frontend/src/sitioPromocional/components/LandingWrapper.jsx` (-window.scrollTo)
- `promo-frontend/src/sitioPromocional/styles/tokens.css` (+escala z-index)
- `promo-frontend/src/sitioPromocional/styles/promocional.css` (z-index navbar/menu/skip/toggles)
- `promo-frontend/src/sitioPromocional/styles/promo-responsive.css` (toggles)
- `promo-frontend/src/index.css` (skip link)

---

Validación final: `vitest` 122/122 (68 frontend + 54 promo), Playwright 8/8, `vite build` OK en ambos frontends. Lint: sin problemas nuevos en archivos tocados (los errores restantes son preexistentes en archivos de configuración y componentes no modificados).