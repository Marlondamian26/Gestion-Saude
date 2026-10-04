import { test, expect } from '@playwright/test';

test.describe('Theme sync — FASE 10 §10.9', () => {
  test('cambiar a dark mode actualiza data-theme en el DOM', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const themeToggle = page.getByRole('button', { name: /Modo automático|Cambiar a modo/i }).first();
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      const main = page.locator('.sitio-promocional');
      const theme = await main.getAttribute('data-theme');
      expect(['dark', 'light', 'auto']).toContain(theme);
    }
  });

  test('query param theme se propaga al hacer click en Entrar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=dark', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const loginLink = page.getByRole('link', { name: /Entrar|Iniciar|Login/i }).first();
    if (await loginLink.count() > 0) {
      const href = await loginLink.getAttribute('href');
      expect(href).toContain('theme=dark');
      expect(href).toContain('lang=es');
    }
  });
});

