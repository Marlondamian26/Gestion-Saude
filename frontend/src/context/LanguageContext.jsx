import React, { createContext, useContext, useState, useEffect } from 'react';

// Platform translations (separated for independent bundles, FASE 8 §8.2)
import { platformTranslations as translations } from './translations/platform';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Try to get saved language from localStorage, default to Portuguese
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'pt';
  });

  // Update the HTML lang attribute when language changes
  // This allows browser translation to work
  useEffect(() => {
    // Update localStorage
    localStorage.setItem('language', language);
    
    // Update HTML lang attribute for browser translation support
    const htmlElement = document.documentElement;
    const langMap = { pt: 'pt-BR', es: 'es', en: 'en' };
    htmlElement.lang = langMap[language] || 'pt-BR';
  }, [language]);

  // Translation function
  const t = (key, params = {}) => {
    const langTranslations = translations[language] || translations.pt;
    let text = langTranslations[key] || translations.pt[key] || key;
    
    // Replace parameters like {count} or {type}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });
    
    return text;
  };

  // Promotional site translation function
  const tPromo = (key, params = {}) => {
    const promoLang = `promo_${language}`;
    const langTranslations = translations[promoLang] || translations.promo_pt;
    let text = langTranslations[key] || translations.promo_pt[key] || key;
    
    // Replace parameters like {count} or {type}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param]);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tPromo, translations: translations[language] }}>
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
