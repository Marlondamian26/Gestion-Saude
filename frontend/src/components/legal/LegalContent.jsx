import React from 'react';
import { legalTranslations } from '../../context/translations/legal';
import { useLanguage } from '../../context/LanguageContext';
import { APP_NAME } from '../../config/constants';

const PLACEHOLDERS = {
  NOMBRE_CLINICA: APP_NAME,
  DIRECCION: '',
  EMAIL_CONTACTO: '',
  TELEFONO: '',
  CIUDAD: '',
  JURISDICCION: '',
  SUPABASE: '',
  RENDER: '',
  TWILIO: '',
  RESEND: '',
  PLAZO_RETENCION: '',
  FECHA: '',
};

const applyPlaceholders = (text) =>
  String(text).replace(/\{\{([A-Z_]+)\}\}/g, (_match, key) => PLACEHOLDERS[key] || '');

export default function LegalContent({ type }) {
  const { language } = useLanguage();
  const dict = legalTranslations[language] || legalTranslations.es;
  const isTerms = type === 'terminos';
  const titleKey = isTerms ? 'terminosTitle' : 'privacidadTitle';

  const sections = [];
  for (let i = 1; i <= 10; i += 1) {
    const tKey = isTerms ? `terminosS${i}Title` : `privacidadS${i}Title`;
    const bKey = isTerms ? `terminosS${i}Body` : `privacidadS${i}Body`;
    if (dict[tKey]) {
      sections.push({ title: dict[tKey], body: dict[bKey] || [] });
    }
  }

  const styles = {
    root: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'var(--text-primary)',
      lineHeight: 1.6,
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      margin: '0 0 12px 0',
      color: 'var(--text-primary)',
    },
    warning: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '12px 16px',
      marginBottom: '18px',
      borderRadius: '8px',
      backgroundColor: 'var(--color-error-bg)',
      border: '1px solid var(--color-error)',
      color: '#721c24',
      fontSize: '13px',
      flexWrap: 'wrap',
    },
    section: {
      marginBottom: '22px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '600',
      margin: '0 0 8px 0',
      color: 'var(--color-patient)',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '4px',
    },
    paragraph: {
      margin: '0 0 6px 0',
      fontSize: '14px',
      color: 'var(--text-secondary)',
      whiteSpace: 'pre-line',
    },
    updated: {
      marginTop: '6px',
      fontSize: '12px',
      color: 'var(--text-muted)',
      fontStyle: 'italic',
    },
  };

  return (
    <section className="legal-content" style={styles.root}>
      <h1 style={styles.title}>{dict[titleKey]}</h1>
      <div style={styles.warning} role="alert">
        {dict.warning}
      </div>
      {sections.map((section, i) => (
        <section key={i} style={styles.section}>
          <h2 style={styles.sectionTitle}>{section.title}</h2>
          {section.body.map((paragraph, j) => (
            <p key={j} style={styles.paragraph}>{applyPlaceholders(paragraph)}</p>
          ))}
        </section>
      ))}
      <p style={styles.updated}>{dict.updated.replace('{FECHA}', '').trim()}</p>
    </section>
  );
}
