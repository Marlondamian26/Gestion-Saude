import { test, expect } from '@playwright/test';

const MOBILE_VIEWS = [
  { name: '320px', width: 320, height: 568 },
  { name: '375px', width: 375, height: 667 },
  { name: '414px', width: 414, height: 896 },
  { name: '768px', width: 768, height: 1024 },
];

const gotoHome = async (page) => {
  await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
};

// Navegación SPA dentro del mismo documento (mantiene sessionStorage y el
// gestor de scroll). pushState simula salir de la página actual como lo haría
// un <Link> de React Router, sin recargar el documento.
const leaveHome = async (page) => {
  await page.evaluate(() => {
    history.pushState({ key: `e2e-${Date.now()}` }, '', '/privacidad');
  });
  await page.waitForTimeout(500);
};

test.describe('Scroll por ruta (Problema A)', () => {
  test('Carga directa de vista legal abre en el top', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/privacidad', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('Hash/ancla interna: scroll al destino, no al top', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.locator('a[href="#servicios"]').first().click();
    await page.waitForTimeout(1000);
    const rect = await page.locator('#servicios').boundingBox();
    expect(rect).not.toBeNull();
    expect(rect.y).toBeLessThan(120);
  });

  test('POP: al volver atrás se restaura la posición de la entrada', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHome(page);
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(800); // el gestor persiste la posición de '/'
    await leaveHome(page); // simula navegar a otra vista (misma sesión)
    await page.goBack();
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});

test.describe('Navbar móvil del sitio promocional (Problema B)', () => {
  for (const vp of MOBILE_VIEWS) {
    test(`se superpone sobre todo el contenido en ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHome(page);

      await page.getByRole('button', { name: /Abrir menú de navegación/i }).click();
      await page.waitForTimeout(500);

      const menu = page.locator('.promo-navbar-mobile--open');
      await expect(menu).toBeVisible();

      const zIndex = await page.evaluate(() => {
        const el = document.querySelector('.promo-navbar-mobile--open');
        return el ? window.getComputedStyle(el).zIndex : null;
      });
      expect(zIndex).toBe('1100');

      await page.locator('.promo-navbar-mobile-link').first().click();
      await page.waitForTimeout(500);
      await expect(page.locator('.promo-navbar-mobile--open')).not.toBeVisible();
    });
  }

  test('escala de z-index: navbar > toggles flotantes, skip link por encima', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHome(page);

    const z = await page.evaluate(() => {
      const get = (sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).zIndex : null;
      };
      return {
        navbar: get('.promo-navbar'),
        toggles: get('.promo-floating-toggles'),
      };
    });
    expect(z.navbar).toBe('2100');
    expect(z.toggles).toBe('2000');
  });
});
