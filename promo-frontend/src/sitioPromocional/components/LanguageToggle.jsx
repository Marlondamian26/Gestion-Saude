import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FaGlobe } from 'react-icons/fa';

// ATENCIÓN: Este componente replica exactamente LanguageToggle.jsx del dashboard.
// Cualquier cambio visual en el original debe replicarse aquí.
// Sólo se adaptó: import path (../../context/LanguageContext) y t→tPromo.

const LanguageToggle = () => {
  const { language, setLanguage, tPromo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'pt', name: tPromo('portuguese') || 'Português', flag: '🇧🇷' },
    { code: 'es', name: tPromo('spanish') || 'Español', flag: '🇪🇸' },
    { code: 'en', name: tPromo('english') || 'English', flag: '🇺🇸' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.button}
        title={tPromo('changeLanguage') || 'Cambiar idioma'}
        aria-label={tPromo('changeLanguage') || 'Cambiar idioma'}
      >
        <span style={styles.flag}>{currentLang.flag}</span>
        <span style={styles.icon}>
          <FaGlobe />
        </span>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span style={styles.dropdownTitle}>{tPromo('language') || 'Idioma'}</span>
          </div>
          <div style={styles.dropdownList}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  ...styles.dropdownItem,
                  ...(language === lang.code ? styles.dropdownItemActive : {})
                }}
              >
                <span style={styles.langFlag}>{lang.flag}</span>
                <span style={styles.langName}>{lang.name}</span>
                {language === lang.code && (
                  <span style={styles.checkmark}>✓</span>
                )}
              </button>
            ))}
          </div>
          <div style={styles.dropdownFooter}>
            <small style={styles.footerText}>
              {tPromo('changeLanguage') || 'Cambiar idioma'}
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-secondary)',
    border: '2px solid var(--border-color)',
    borderRadius: '50%',
    width: '55px',
    height: '55px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--box-shadow)',
  },
  flag: {
    fontSize: '24px',
    color: '#8b5cf6',
  },
  icon: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  dropdown: {
    position: 'absolute',
    top: '60px',
    right: '0',
    width: '180px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    boxShadow: 'var(--box-shadow-hover)',
    zIndex: 1001,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: '12px 15px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-tertiary)',
  },
  dropdownTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  dropdownList: {
    padding: '5px',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: '14px',
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },
  dropdownItemActive: {
    backgroundColor: 'var(--color-patient)',
    color: 'white',
  },
  langFlag: {
    fontSize: '16px',
  },
  langName: {
    flex: 1,
  },
  checkmark: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  dropdownFooter: {
    padding: '8px 12px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-tertiary)',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
};

export default LanguageToggle;
