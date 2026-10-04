/**
 * Tests para LanguageContext — paridad i18n (§4.3.5).
 * Verifica que es y en contienen todas las claves de pt.
 */
import { describe, it, expect } from 'vitest';

import * as langModule from '../../context/LanguageContext';

import fs from 'node:fs';
import path from 'node:path';

// FASE 8 §8.2: Las traducciones de plataforma están en translations/platform.js
// Las traducciones promo están en translations/promo.js (ver LanguageContext.test.promo.jsx)
const filePath = path.resolve(__dirname, '../../context/translations/platform.js');
const content = fs.readFileSync(filePath, 'utf8');

function extractBlockKeys(startIdx, endIdx) {
  const block = content.slice(startIdx, endIdx);
  const keys = new Set();
  const lines = block.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\w+):\s*['{\[]/);
    if (match && !trimmed.startsWith('}')) {
      keys.add(match[1]);
    }
  }
  return keys;
}

const ptIdx = content.indexOf('pt: {');
const esIdx = content.indexOf('es: {');
const enIdx = content.indexOf('en: {');

const ptSet = extractBlockKeys(ptIdx + 4, esIdx);
const esSet = extractBlockKeys(esIdx + 4, enIdx);
const enSet = extractBlockKeys(enIdx + 4);

describe('LanguageContext — Paridad de claves', () => {
  it('ES tiene todas las claves de PT', () => {
    const missing = [...ptSet].filter((k) => !esSet.has(k));
    expect(missing).toEqual([]);
  });

  it('EN tiene todas las claves de PT', () => {
    const missing = [...ptSet].filter((k) => !enSet.has(k));
    expect(missing).toEqual([]);
  });

  it('PT tiene al menos 400 claves (base no vaciada)', () => {
    expect(ptSet.size).toBeGreaterThan(400);
  });

  it('ES tiene al menos 400 claves', () => {
    expect(esSet.size).toBeGreaterThan(400);
  });

  it('EN tiene al menos 400 claves', () => {
    expect(enSet.size).toBeGreaterThan(400);
  });
});
