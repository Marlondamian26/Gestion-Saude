import React, { createContext, useContext, useState, useEffect } from 'react';

import { promoTranslations as translations } from './translations/promo';
import { writeLanguage, readLanguage } from '../utils/storage';
import { readFromUrl, LS_LANG_KEY } from '../utils/syncPreferences';

const LanguageContext = createContext();

const VALID_LANGS = ['pt', 'es', 'en'];

const detectInitialLanguage = () => {
  const fromUrl = readFromUrl();
  if (fromUrl.language) return fromUrl.language;
  const fromStorage = readLanguage();
  if (fromStorage && VALID_LANGS.includes(fromStorage)) return fromStorage;
  if (typeof window !== 'undefined' && navigator.language) {
    const browserLang = navigator.language.slice(0, 2);
    if (VALID_LANGS.includes(browserLang)) return browserLang;
  }
  return 'pt';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => detectInitialLanguage());

  useEffect(() => {
    writeLanguage(language);
    const htmlElement = document.documentElement;
    const langMap = { pt: 'pt-BR', es: 'es', en: 'en' };
    htmlElement.lang = langMap[language] || 'pt-BR';
  }, [language]);

  const t = (key) => key;

  const tPromo = (key, params = {}) => {
    const promoLang = `promo_${language}`;
    const langTranslations = translations[promoLang] || translations.promo_pt;
    let text = langTranslations[key] || translations.promo_pt[key] || key;
    Object.keys(params).forEach((param) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tPromo, translations: translations[`promo_${language}`] || translations.promo_pt }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
