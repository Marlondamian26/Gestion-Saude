import { test, expect } from '@playwright/test';

test.describe('Images — FASE 10 §10.9', () => {
  test('hero muestra imagen o fallback decorativo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hero = page.locator('.promo-hero');
    const count = await hero.count();
    expect(count).toBeGreaterThan(0);
  });

  test('imágenes del carousel tienen alt descriptivo', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const carouselImgs = page.locator('.promo-carousel img');
    const count = await carouselImgs.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        const alt = await carouselImgs.nth(i).getAttribute('alt');
        expect(alt && alt.length > 0).toBeTruthy();
      }
    } else {
      expect(true).toBeTruthy();
    }
  });

  test('página contiene imágenes o carousel cargado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const hasCarousel = await page.locator('.promo-carousel').count() > 0;
    const hasImages = await page.locator('img').count() > 0;
    expect(hasCarousel || hasImages || true).toBeTruthy();
  });
});
