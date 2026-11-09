import { test, expect } from '@playwright/test';

const MOBILE_VIEWS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '414x896', width: 414, height: 896 },
  { name: '768x1024', width: 768, height: 1024 },
];

const gotoHome = async (page) => {
  await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
};

const openMenu = async (page) => {
  await page.locator('.promo-navbar-toggle').click();
  await page.waitForTimeout(400);
};

const closeMenu = async (page) => {
  await page.locator('.promo-navbar-toggle').click();
  await page.waitForTimeout(300);
};

const scrollToSection3 = async (page) => {
  await page.evaluate(() => {
    const el = document.getElementById('testimonios') || document.getElementById('contacto');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1200);
};

const menuMetrics = async (page) => {
  return await page.evaluate(() => {
    const el = document.querySelector('.promo-navbar-mobile--open');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const firstLink = document.querySelector('.promo-navbar-mobile-link');
    const linkRect = firstLink ? firstLink.getBoundingClientRect() : null;
    return {
      width: Math.round(r.width),
      height: Math.round(r.height),
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      position: cs.position,
      overflowY: cs.overflowY,
      overscrollBehavior: cs.overscrollBehavior,
      linkHeight: linkRect ? Math.round(linkRect.height) : null,
    };
  });
};

test.describe('Menú móvil del sitio promocional — dimensiones estables (Fase 3)', () => {
  for (const vp of MOBILE_VIEWS) {
    test(`alto y ancho estables en hero y sección 3 — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoHome(page);

      await openMenu(page);
      const hero = await menuMetrics(page);

      await closeMenu(page);
      await scrollToSection3(page);
      await openMenu(page);
      const sec3 = await menuMetrics(page);

      expect(hero).not.toBeNull();
      expect(sec3).not.toBeNull();
      // Ancho = ancho del viewport
      expect(hero.width).toBe(vp.width);
      expect(sec3.width).toBe(vp.width);
      // Alto estable: mismo alto en hero y sección 3 (viewport - navbar)
      expect(sec3.height).toBe(hero.height);
      // Alto mayor al mínimo táctil razonable (viewport - navbar)
      expect(sec3.height).toBeGreaterThan(vp.height - 120);
      // No se recorta por abajo: el fondo toca el borde inferior del viewport
      expect(sec3.bottom).toBeGreaterThanOrEqual(vp.height - 2);
    });
  }

  test('scroll interno del menú no arrastra la página de fondo (overscroll-behavior: contain)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHome(page);
    await openMenu(page);

    const menu = page.locator('.promo-navbar-mobile--open');
    await expect(menu).toBeVisible();

    const osb = await page.evaluate(() => window.getComputedStyle(document.querySelector('.promo-navbar-mobile--open')).overscrollBehavior);
    expect(osb).toBe('contain');

    // Hacer scroll dentro del menú hacia abajo
    await menu.evaluate((el) => { el.scrollTop = el.scrollHeight - el.clientHeight; });
    await page.waitForTimeout(300);

    // El menú debe permanecer abierto y en su sitio
    await expect(menu).toBeVisible();
    const rect = await menu.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect.height).toBeGreaterThan(400);
  });

  test('cierre por clic en enlace y por navegación funciona tras los cambios', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHome(page);

    await openMenu(page);
    await page.locator('.promo-navbar-mobile-link').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('.promo-navbar-mobile--open')).not.toBeVisible();

    // Reabrir y cerrar con Escape
    await page.getByRole('button', { name: /Abrir menú de navegación/i }).click();
    await page.waitForTimeout(400);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.locator('.promo-navbar-mobile--open')).not.toBeVisible();
  });

  test('accesibilidad: aria-expanded coherente al abrir/cerrar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await gotoHome(page);

    const toggle = page.locator('.promo-navbar-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await page.waitForTimeout(400);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Desktop — sin cambios en el menú móvil (≥ breakpoint 769px)', () => {
  test('el menú móvil no se muestra en desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoHome(page);

    const toggle = page.getByRole('button', { name: /Abrir menú de navegación/i });
    await expect(toggle).not.toBeVisible();

    const menu = page.locator('.promo-navbar-mobile--open');
    await expect(menu).not.toBeVisible();
  });
});
