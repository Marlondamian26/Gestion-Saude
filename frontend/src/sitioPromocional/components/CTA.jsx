import React from 'react';
import { FaCalendarCheck, FaUserPlus, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { PLATFORM_URL, REGISTRO_URL, CLINIC_PHONE } from '../config/constants';
import { useInView } from '../hooks/useInView';

function CTA() {
  const { tPromo } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_PHONE.replace(/\s/g, '')}`, '_blank');
  };

  return (
    <section
      ref={ref}
      className={`promo-cta ${isInView ? 'animate-in' : ''}`}
    >
      <div className={`promo-cta-content ${isInView ? 'animate-fade-up' : ''}`}>
        <h2>{tPromo('ctaTitle')}</h2>
        <p>
          {tPromo('ctaSubtitle')}
        </p>

        <div className="promo-cta-buttons">
          <a href={REGISTRO_URL} className="promo-btn promo-btn-primary">
            <FaUserPlus />
            {tPromo('ctaRegister')}
          </a>
          <a href={PLATFORM_URL} className="promo-btn promo-btn-secondary">
            <FaCalendarCheck />
            {tPromo('ctaLogin')}
          </a>
          <button className="promo-btn promo-btn-secondary" onClick={handleWhatsApp}>
            <FaWhatsapp />
            {tPromo('navWhatsApp')}
          </button>
        </div>
      </div>
    </section>
  );
}

export default CTA;