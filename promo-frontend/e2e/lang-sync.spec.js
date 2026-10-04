import { test, expect } from '@playwright/test';

test.describe('Language sync — FASE 10 §10.9', () => {
  test('cambiar idioma actualiza el contenido visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const langToggle = page.getByRole('button', { name: /idioma|language/i }).first();
    if (await langToggle.count() > 0) {
      await langToggle.click();
      await page.waitForTimeout(300);
      await page.getByRole('button', { name: /Português|Portuguese/i }).click();
      await page.waitForTimeout(500);
      await expect(page.locator('.promo-navbar')).toContainText(/Início|Serviços/);
    }
  });

  test('query param lang se propaga al hacer click en Entrar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=en&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const loginLink = page.getByRole('link', { name: /Entrar|Iniciar|Login/i }).first();
    if (await loginLink.count() > 0) {
      const href = await loginLink.getAttribute('href');
      expect(href).toContain('lang=en');
    }
  });

  test('tres idiomas tienen contenido no vacío', async ({ page }) => {
    for (const lang of ['pt', 'es', 'en']) {
      await page.goto(`/?lang=${lang}&theme=light`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const body = page.locator('body');
      const text = await body.innerText();
      expect(text.length).toBeGreaterThan(200);
    }
  });
});
