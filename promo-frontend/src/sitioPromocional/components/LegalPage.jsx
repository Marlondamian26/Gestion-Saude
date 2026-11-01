import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { CLINIC_NAME, CLINIC_ADDRESS, CLINIC_PHONE, CLINIC_EMAIL } from '../config/constants';

const CIUDAD = 'Luanda, Angola';
const JURISDICCION = 'Angola (Lei n.º 22/11 de Proteção de Dados Pessoais); RGPD si el titular reside en la UE; LGPD si aplica';

// Valores conocidos del consultorio. Los placeholders que no tienen valor real
// (PLAZO_RETENCION, FECHA) se dejan como {{...}} para que el dueño los complete.
const KNOWN = {
  NOMBRE_CLINICA: CLINIC_NAME,
  DIRECCION: CLINIC_ADDRESS,
  EMAIL_CONTACTO: CLINIC_EMAIL,
  TELEFONO: CLINIC_PHONE,
  CIUDAD,
  JURISDICCION,
  SUPABASE: '{{SUPABASE}}',
  RENDER: '{{RENDER}}',
  TWILIO: '{{TWILIO}}',
  RESEND: '{{RESEND}}',
};

const applyPlaceholders = (text) =>
  String(text).replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => KNOWN[key] || match);

export default function LegalPage({ titleKey, warningKey, sections }) {
  const { tPromo } = useLanguage();

  return (
    <div className="promo-legal-page">
      <header className="promo-legal-header">
        <Link to="/" aria-label={tPromo('volverInicio')}>
          <span aria-hidden>←</span> {tPromo('volverInicio')}
        </Link>
      </header>

      <main className="promo-legal-main" id="main-content">
        <div className="promo-legal-warning" role="alert">
          {tPromo(warningKey)}
        </div>

        <h1 className="promo-legal-title">{tPromo(titleKey)}</h1>

        <div className="promo-legal-content">
          {sections.map((section, index) => (
            <section key={index} className="promo-legal-section">
              <h2 className="promo-legal-section-title">{tPromo(section.title)}</h2>
              {section.body.map((paragraph, pIndex) => (
                <p key={pIndex} className="promo-legal-paragraph">
                  {applyPlaceholders(tPromo(paragraph))}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="promo-legal-updated">
          {tPromo('legalUltimaActualizacao', { FECHA: '{{FECHA}}' })}
        </p>
      </main>

      <footer className="promo-legal-footer">
        <p>© {new Date().getFullYear()} {CLINIC_NAME}. {tPromo('footerRights')}</p>
      </footer>
    </div>
  );
}
