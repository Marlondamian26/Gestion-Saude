# Evaluación: Independencia Real del Sitio Promocional (FASE 9 §9.0.2)

**Fecha:** 2026-10-04T17:30Z
**Contexto:** FASE 8 dejó el promo como segundo entry point Vite dentro de `frontend/`, compartiendo `package.json` y `node_modules`. FASE 9 exige independencia real.

## Opciones evaluadas

| Opción | Descripción | Pros | Contras | Veredicto |
|---|---|---|---|---|
| **A) `frontend/` + `promo-frontend/` (carpetas hermanas, cada una con su `package.json`)** | Monorepo con dos proyectos Vite totalmente separados. Comparten repo Git pero nada de `node_modules`. | Independencia real; despliegues limpios; cero contaminación de deps; simple de entender. | Duplicación de algunas utilidades (theme/language logic) o uso de un paquete compartido opcional. | **ELEGIDA** |
| **B) npm workspaces (`packages/platform`, `packages/promo`, `packages/shared`)** | Monorepo con workspace hoisting. | Comparte `shared/` (contextos, constants). | `node_modules` hoisted → no es independencia real; builds más complejos. | ❌ No cumple el requisito de independencia. |
| **C) Repos Git separados** | Máxima separación. | Total independencia. | Duplicación de CI, contextos, sincronización manual. | ❌ Excesivo para este proyecto. |
| **D) Segundo entry point Vite (lo que hizo FASE 8)** | Mismo `package.json`. | Menos duplicación. | No cumple el requisito de independencia. | ❌ Descartado. |

## Decisión final

**Opción A** — `promo-frontend/` como proyecto Vite independiente, hermano de `frontend/`.

### Justificación

1. **Independencia real de dependencias:** cada proyecto tiene su propio `package.json` y `package-lock.json`. El `npm install` en cada uno genera un `node_modules/` independiente. Verificado: `promo-frontend/node_modules/react@19.3.0` ≠ `frontend/node_modules/react@19.2.4`.

2. **Build aislado:** `vite build` en cada proyecto genera `dist/` independiente. El bundle de la plataforma no contiene componentes del promo (`grep -rn "sitioPromocional" frontend/dist/` → vacío). El bundle del promo no contiene componentes del dashboard.

3. **Despliegue limpio en Render:** cada Static Site usa su propio `rootDir` y ejecuta `npm ci && npm run build`.

4. **Simplicidad:** sin workspace hoisting, sin resolución de path compleja. Los utilitarios compartidos (theme/language logic) se duplican minimalmente — ~200 líneas cada uno — lo cual es aceptable por la ganancia de independencia.

5. **No se usa Module Federation** (sobreengineering) ni repos separados (duplicación de CI excesiva).
