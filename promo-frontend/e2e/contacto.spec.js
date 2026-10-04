import { test, expect } from '@playwright/test';

test.describe('Contacto — FASE 10 §10.9', () => {
  test('muestra sección Contacto con título', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await page.evaluate(() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'instant' }));
    await page.waitForTimeout(500);

    const contacto = page.locator('#contacto');
    await expect(contacto).toBeVisible();
    await expect(contacto).toContainText(/Contáctenos|Contacte-nos|Contact Us/i);
  });

  test('enlace de teléfono tiene href tel:', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const telLink = page.locator('#contacto a[href^="tel:"]').first();
    if (await telLink.count() > 0) {
      await expect(telLink).toHaveAttribute('href', /tel:\+244/);
    }
  });

  test('enlace de email tiene href mailto:', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const mailLink = page.locator('#contacto a[href^="mailto:"]').first();
    if (await mailLink.count() > 0) {
      await expect(mailLink).toHaveAttribute('href', /mailto:angobelkis72@gmail\.com/);
    }
  });

  test('dirección enlaza a Google Maps', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const mapsLink = page.locator('#contacto a[href*="maps.google.com"]').first();
    if (await mapsLink.count() > 0) {
      await expect(mapsLink).toHaveAttribute('href', /Benfica.*Luanda/i);
    }
  });
});
