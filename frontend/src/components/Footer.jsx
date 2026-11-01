import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FaHeart, FaCode } from 'react-icons/fa';
import { APP_NAME, APP_VERSION, PRIVACY_URL, TERMS_URL } from '../config/constants';

const Footer = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const styles = {
    footer: {
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      padding: '20px 0',
      marginTop: 'auto',
      width: '100%',
      fontSize: '14px',
      color: 'var(--text-muted)',
      textAlign: 'center',
      transition: 'all 0.3s ease',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 20px',
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '5px',
    },
    text: {
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    heart: {
      color: '#e74c3c',
      animation: 'pulse 1.5s ease infinite',
      margin: '0 3px',
    },
    code: {
      color: 'var(--color-admin)',
      margin: '0 3px',
    },
    link: {
      color: 'var(--color-patient)',
      textDecoration: 'none',
      transition: 'color 0.3s ease',
      ':hover': {
        color: 'var(--color-admin)',
        textDecoration: 'underline',
      },
    },
    small: {
      fontSize: '12px',
      color: 'var(--text-muted)',
      opacity: 0.8,
    },
    legalLinks: {
      display: 'flex',
      gap: '6px',
      justifyContent: 'center',
      fontSize: '12px',
    },
    legalLink: {
      color: 'var(--text-muted)',
      textDecoration: 'underline',
    },
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.text}>
          © {currentYear} <strong style={{ color: 'var(--text-primary)' }}>{APP_NAME}</strong>.
          </p>
          <p style={styles.small}>
            {t('version')} {APP_VERSION} | {t('medicalSystem')}
          </p>
          <nav aria-label={t('legalLinksAria')} style={styles.legalLinks}>
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" style={styles.legalLink}>
              {t('termsLink')}
            </a>
            <span aria-hidden="true"> · </span>
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" style={styles.legalLink}>
              {t('privacyLink')}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

// Añadir animación de pulso para el corazón
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(styleSheet);

export default Footer;