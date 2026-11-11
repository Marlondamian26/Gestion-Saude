import React from 'react';
import { FaGlobe } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { buildPromoUrl } from '../utils/syncPreferences';

const PromocionalToggle = () => {
  const { t, language } = useLanguage();
  const { theme, isAutomatic } = useTheme();

  const handleGoToPromo = () => {
    const baseUrl = import.meta.env.VITE_PROMO_URL || 'https://gestion-saude-promo.onrender.com';
    const themeParam = isAutomatic ? 'auto' : theme;
    window.location.href = buildPromoUrl(baseUrl, { language, theme: themeParam });
  };

  return (
    <button
      className="topbar-control"
      onClick={handleGoToPromo}
      style={styles.button}
      title={t('viewPromoSite') || 'Ver sitio promocional'}
      aria-label={t('viewPromoSite') || 'Ver sitio promocional'}
    >
      <span style={styles.icon}>
        <FaGlobe />
      </span>
    </button>
  );
};

const styles = {
  button: {
    backgroundColor: 'var(--bg-secondary)',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--box-shadow)',
    textDecoration: 'none',
  },
  icon: {
    fontSize: 'clamp(14px, 3vw, 20px)',
    color: '#8b5cf6',
  },
};

export default PromocionalToggle;
