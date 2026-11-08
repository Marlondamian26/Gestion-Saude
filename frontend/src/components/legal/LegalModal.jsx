import React from 'react';
import { legalTranslations } from '../../context/translations/legal';
import { useLanguage } from '../../context/LanguageContext';
import LegalContent from './LegalContent';

export default function LegalModal({ isOpen, onClose, onAccept }) {
  const { language } = useLanguage();
  const dict = legalTranslations[language] || legalTranslations.es;

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto',
    },
    panel: {
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '720px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: 'var(--text-primary)',
    },
    header: {
      padding: '20px 24px',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: '700',
      color: 'var(--text-primary)',
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      lineHeight: '1',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      padding: 0,
      ':hover': { color: 'var(--text-primary)' },
    },
    body: {
      overflowY: 'auto',
      padding: '20px 24px',
      maxHeight: '65vh',
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      backgroundColor: 'var(--bg-tertiary)',
    },
    cancelBtn: {
      background: 'transparent',
      border: '1px solid var(--border-color)',
      color: 'var(--text-primary)',
      padding: '8px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: 'pointer',
      ':hover': { backgroundColor: 'var(--bg-tertiary)' },
    },
    acceptBtn: {
      backgroundColor: 'var(--color-patient)',
      color: 'white',
      border: 'none',
      padding: '8px 18px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      ':hover': { opacity: 0.9 },
    },
  };

  return (
    <div style={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label="Términos y Política de Privacidad">
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>{dict.accept}</span>
          <button style={styles.closeBtn} onClick={onClose} aria-label={dict.close}>
            &times;
          </button>
        </div>
        <div style={styles.body}>
          <LegalContent type="terminos" />
          <div style={{ marginTop: '26px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
            <LegalContent type="privacidad" />
          </div>
        </div>
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>
            {dict.cancel}
          </button>
          <button style={styles.acceptBtn} onClick={onAccept}>
            {dict.acceptTerms}
          </button>
        </div>
      </div>
    </div>
  );
}
