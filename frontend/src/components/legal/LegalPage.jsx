import React from 'react';
import { useNavigate } from 'react-router-dom';
import { legalTranslations } from '../../context/translations/legal';
import { useLanguage } from '../../context/LanguageContext';
import LegalContent from './LegalContent';

export default function LegalPage({ type }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const dict = legalTranslations[language] || legalTranslations.es;

  const styles = {
    root: {
      minHeight: 'var(--app-viewport-min-height, 100vh)',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '24px',
      cursor: 'pointer',
    },
    back: {
      fontSize: '20px',
      lineHeight: '1',
      color: 'var(--color-patient)',
      textDecoration: 'none',
    },
    backLabel: {
      fontSize: '14px',
      color: 'var(--text-muted)',
      textDecoration: 'none',
      ':hover': { textDecoration: 'underline' },
    },
    container: {
      maxWidth: '720px',
      margin: '0 auto',
    },
    title: {
      fontSize: '26px',
      fontWeight: '700',
      margin: '0 0 10px 0',
      color: 'var(--text-primary)',
    },
    warning: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '12px 16px',
      marginBottom: '22px',
      borderRadius: '8px',
      backgroundColor: 'var(--color-error-bg)',
      border: '1px solid var(--color-error)',
      color: '#721c24',
      fontSize: '13px',
      flexWrap: 'wrap',
    },
    updated: {
      marginTop: '8px',
      fontSize: '12px',
      color: 'var(--text-muted)',
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.back} onClick={() => navigate(-1)} role="button" tabIndex={0} aria-label={dict.backHome}>
          &larr;
        </span>
        <a href="/" style={styles.backLabel}>{dict.backHome}</a>
      </div>
      <div style={styles.container}>
        <h1 style={styles.title}>{dict[type === 'privacidad' ? 'privacidadTitle' : 'terminosTitle']}</h1>
        <div style={styles.warning} role="alert">{dict.warning}</div>
        <LegalContent type={type} />
        <p style={styles.updated}>{dict.updated.replace('{FECHA}', '').trim()}</p>
      </div>
    </div>
  );
}
