import { test, expect } from '@playwright/test';

test.describe('Landing — FASE 10 §10.9', () => {
  test('carga todas las secciones principales', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await expect(page.locator('#inicio')).toBeVisible();
    await expect(page.locator('#servicios')).toBeVisible();
    await expect(page.locator('#sobre-nosotros')).toBeVisible();
    await expect(page.locator('#testimonios')).toBeVisible();
    await expect(page.locator('#contacto')).toBeVisible();
  });

  test('muestra navbar con enlaces y toggles', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const navbar = page.locator('.promo-navbar');
    await expect(navbar).toBeVisible();

    await expect(page.getByRole('link', { name: /Inicio/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Servicios/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Sobre Nosotros/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Testimonios/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Contacto/i }).first()).toBeVisible();

    await expect(page.getByRole('button', { name: /Modo automático|Cambiar a modo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cambiar idioma|Idioma/i })).toBeVisible();
  });

  test('aplica data-theme al contenedor principal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lang=es&theme=dark', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const main = page.locator('.sitio-promocional');
    await expect(main).toHaveAttribute('data-theme', 'dark');
  });
});
