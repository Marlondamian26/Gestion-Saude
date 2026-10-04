import React, { createContext, useContext, useState, useEffect } from 'react';

import { promoTranslations } from './translations/promo';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    return saved || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    const htmlElement = document.documentElement;
    const langMap = { pt: 'pt-BR', es: 'es', en: 'en' };
    htmlElement.lang = langMap[language] || 'pt-BR';
  }, [language]);

  const t = (key) => {
    return key;
  };

  const tPromo = (key, params = {}) => {
    const promoLang = `promo_${language}`;
    const langTranslations = promoTranslations[promoLang] || promoTranslations.promo_pt;
    let text = langTranslations[key] || promoTranslations.promo_pt[key] || key;

    Object.keys(params).forEach((param) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tPromo, translations: promoTranslations[`promo_${language}`] || promoTranslations.promo_pt }}>
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
