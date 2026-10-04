/**
 * check-i18n.js — Verifica paridad de claves entre pt, es, en.
 * FASE 4 §4.3.2.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '../src/context/LanguageContext.jsx');
const content = fs.readFileSync(FILE, 'utf8');

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

if (ptIdx === -1 || esIdx === -1 || enIdx === -1) {
  console.error('ERROR: No se encontraron bloques pt/es/en en LanguageContext.jsx');
  process.exit(1);
}

const ptSet = extractBlockKeys(ptIdx + 4, esIdx);
const esSet = extractBlockKeys(esIdx + 4, enIdx);
const enSet = extractBlockKeys(enIdx + 4, content.length);

let hasErrors = false;

console.log('\n=== Auditoría i18n (FASE 4 §4.3.2) ===\n');
console.log(`pt: ${ptSet.size} claves`);
console.log(`es: ${esSet.size} claves`);
console.log(`en: ${enSet.size} claves\n`);

const missingES = [...ptSet].filter((k) => !esSet.has(k)).sort();
const missingEN = [...ptSet].filter((k) => !enSet.has(k)).sort();

if (missingES.length > 0) {
  hasErrors = true;
  console.log(`❌ ES falta ${missingES.length} clave(s) de pt:`);
  console.log(`   ${missingES.join(', ')}\n`);
} else {
  console.log('✅ ES tiene todas las claves de pt\n');
}

if (missingEN.length > 0) {
  hasErrors = true;
  console.log(`❌ EN falta ${missingEN.length} clave(s) de pt:`);
  console.log(`   ${missingEN.join(', ')}\n`);
} else {
  console.log('✅ EN tiene todas las claves de pt\n');
}

if (hasErrors) {
  console.error('Falta completar paridad i18n.');
  process.exit(1);
}

console.log('✅ Paridad i18n completa.');
process.exit(0);
