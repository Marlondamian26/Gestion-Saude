/**
 * Tests para LanguageContext — paridad i18n (§4.3.5).
 * Verifica que es y en contienen todas las claves de pt.
 */
import { describe, it, expect } from 'vitest';

// Importamos el contexto para extraer los diccionarios
import LanguageContext from '../../context/LanguageContext';

// Extraemos los diccionarios de traducción del módulo
// LanguageContext.jsx exporta el contexto; las traducciones están como const "translations"
// usamos una técnica para obtenerlas
import * as langModule from '../../context/LanguageContext';

function getTranslations() {
  // El archivo LanguageContext.jsx exporta LanguageContext y LanguageProvider.
  // Las traducciones son un const no exportado. Las extraemos con regex.
  // Alternativa: test indirecta — renderizar un componente que use useLanguage.
  return null;
}

// Como las traducciones no están exportadas, usamos regex sobre el archivo fuente
import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve(__dirname, '../../context/LanguageContext.jsx');
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
