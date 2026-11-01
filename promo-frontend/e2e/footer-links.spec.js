import { test, expect } from '@playwright/test';

test.describe('Footer links — FASE 13 §13.2/§13.5', () => {
  const footer = (page) => page.locator('.promo-footer');

  test('click en un servicio del footer hace scroll suave a #servicios', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await footer(page).locator('a').filter({ hasText: /Consulta Médica/ }).first().click();
    await page.waitForTimeout(800);

    await expect(page.locator('#servicios')).toBeInViewport();
  });

  test('las anclas del footer llegan a todas las secciones requeridas', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const anchors = [
      ['Inicio', '#inicio'],
      ['Servicios', '#servicios'],
      ['Sobre Nosotros', '#sobre-nosotros'],
      ['Contacto', '#contacto'],
    ];

    for (const [label, target] of anchors) {
      await footer(page).getByRole('link', { name: label, exact: true }).click();
      await expect(page.locator(target)).toBeInViewport();
    }
  });

  test('navega a paginas legales desde el footer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await footer(page).getByRole('link', { name: /Política de Privacidad/i }).click();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/privacidad/);

    await page.getByRole('link', { name: /Volver al inicio/i }).click();
    await page.waitForTimeout(800);

    await footer(page).getByRole('link', { name: /Términos de Uso/i }).click();
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/\/terminos/);
  });

  test('footer solo expone WhatsApp y email como redes reales', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await expect(footer(page).locator('a[href^="https://wa.me"]')).toBeVisible();
    await expect(footer(page).locator('a[href^="mailto:"]')).toBeVisible();
    await expect(footer(page).locator('a[href*="facebook.com"]')).not.toBeVisible();
    await expect(footer(page).locator('a[href*="instagram.com"]')).not.toBeVisible();
  });
});
