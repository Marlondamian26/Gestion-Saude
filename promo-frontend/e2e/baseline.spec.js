import { test } from '@playwright/test';
import path from 'path';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];

const THEMES = ['light', 'dark'];
const LANGS = ['pt', 'es', 'en'];

test.describe('Baseline screenshots — FASE 10 §10.0', () => {
  for (const theme of THEMES) {
    for (const lang of LANGS) {
      for (const vp of VIEWPORTS) {
        const label = `${theme}-${lang}-${vp.name}`;
        test(`before-${label}`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });

          const url = `/?lang=${lang}&theme=${theme}`;
          await page.goto(url, { waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);

          const filePath = path.join('docs/design/before', `promo-full-${label}.png`);
          await page.screenshot({ path: filePath, fullPage: true, animations: 'disabled' });
        });
      }
    }
  }
});
