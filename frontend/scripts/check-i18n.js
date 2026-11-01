/**
 * check-i18n.js — Verifica paridad de claves entre pt, es, en.
 * FASE 4 §4.3.2.
 */
import { platformTranslations } from '../src/context/translations/platform.js';
import process from 'node:process';

const requiredLegalKeys = [
  'aceptaTerminosPrefix',
  'termsLink',
  'and',
  'privacyLink',
  'legalLinksAria',
  'acceptTermsRequired',
];
const ptKeys = new Set(Object.keys(platformTranslations.pt));
let hasErrors = Object.keys(platformTranslations).some(
  (language) => !['pt', 'es', 'en'].includes(language)
);

console.log('\n=== Auditoría i18n (FASE 4 §4.3.2) ===\n');
console.log(`pt: ${ptKeys.size} claves`);

for (const language of ['es', 'en']) {
  const translations = platformTranslations[language];
  if (!translations) {
    hasErrors = true;
    console.error(`❌ Falta el diccionario ${language}`);
    continue;
  }

  const missing = [...ptKeys].filter((key) => !(key in translations)).sort();
  if (missing.length) {
    hasErrors = true;
    console.error(`❌ ${language.toUpperCase()} falta ${missing.length} clave(s) de pt: ${missing.join(', ')}`);
  } else {
    console.log(`✅ ${language.toUpperCase()} tiene todas las claves de pt`);
  }

  const missingLegal = requiredLegalKeys.filter((key) => !(key in translations));
  if (missingLegal.length) {
    hasErrors = true;
    console.error(`❌ ${language.toUpperCase()} falta claves legales: ${missingLegal.join(', ')}`);
  }
}

const missingLegalPt = requiredLegalKeys.filter((key) => !(key in platformTranslations.pt));
if (missingLegalPt.length) {
  hasErrors = true;
  console.error(`❌ PT falta claves legales: ${missingLegalPt.join(', ')}`);
}

if (hasErrors) {
  console.error('Falta completar paridad i18n.');
  process.exit(1);
}

console.log('✅ Paridad i18n completa.');
process.exit(0);
