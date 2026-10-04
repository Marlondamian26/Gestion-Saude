import React from 'react';
import { FaCalendarCheck, FaUserPlus, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { PLATFORM_URL, REGISTRO_URL, CLINIC_PHONE, buildPlatformUrl } from '../config/constants';
import { useInView } from '../hooks/useInView';

function CTA() {
  const { tPromo, language } = useLanguage();
  const { theme, isAutomatic } = useTheme();
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_PHONE.replace(/\s/g, '')}`, '_blank');
  };

  const themeParam = isAutomatic ? 'auto' : theme;

  return (
    <section
      ref={ref}
      className={`promo-cta ${isInView ? 'animate-in' : ''}`}
      role="region"
      aria-labelledby="cta-title"
    >
      <div className={`promo-cta-content ${isInView ? 'animate-fade-up' : ''}`}>
        <h2 id="cta-title">{tPromo('ctaTitle')}</h2>
        <p>
          {tPromo('ctaSubtitle')}
        </p>

        <div className="promo-cta-buttons">
          <a href={buildPlatformUrl(REGISTRO_URL, { language, theme: themeParam })} className="promo-btn promo-btn-primary" rel="noopener">
            <FaUserPlus />
            {tPromo('ctaRegister')}
          </a>
          <a href={buildPlatformUrl(PLATFORM_URL, { language, theme: themeParam })} className="promo-btn promo-btn-secondary" rel="noopener">
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
