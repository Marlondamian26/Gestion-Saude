import React, { useEffect, useState, useRef } from 'react';
import { FaStethoscope, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { PLATFORM_URL, REGISTRO_URL, CLINIC_PHONE, buildPlatformUrl } from '../config/constants';
import { API_URL, wakeUpBackend, fetchWithRetry, getImageUrl } from '../../utils/apiUtils';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

function Hero() {
  const { tPromo, language } = useLanguage();
  const { theme, isAutomatic } = useTheme();
  const [heroImage, setHeroImage] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const prefersReduced = usePrefersReducedMotion();
  const scrollRef = useRef(0);

  useEffect(() => {
    if (prefersReduced) return undefined;
    const onScroll = () => {
      scrollRef.current = window.scrollY || window.pageYOffset;
      document.documentElement.style.setProperty('--hero-scroll-y', scrollRef.current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [prefersReduced]);

  useEffect(() => {
    let cancelled = false;
    const fetchHeroImage = async () => {
      try {
        await wakeUpBackend();
        const response = await fetchWithRetry(`${API_URL}/sitio-imagenes/hero/`, {}, 3, 15000);
        if (!response.ok) return;
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;
        const data = await response.json();
        if (!cancelled && data && data.imagen) setHeroImage(data);
      } catch (e) {
        if (import.meta.env?.DEV) console.error('[Hero] fetch error:', e);
      } finally {
        if (!cancelled) setImgLoaded(true);
      }
    };
    fetchHeroImage();
    return () => { cancelled = true; };
  }, []);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_PHONE.replace(/\s/g, '')}`, '_blank');
  };

  const themeParam = isAutomatic ? 'auto' : theme;

  return (
    <section
      className="promo-hero"
      aria-label={tPromo('heroSectionLabel') || 'Inicio'}
      role="region"
      aria-labelledby="hero-title"
    >
      <div
        className="promo-hero-media"
        style={{ backgroundImage: heroImage ? `url(${getImageUrl(heroImage.imagen)})` : undefined }}
      >
        <div className="promo-hero-overlay" />
        <div className="promo-hero-fade" />
      </div>

      <div className="promo-hero-content promo-container">
        <div className={`promo-hero-text ${prefersReduced ? 'no-animate' : 'animate'}`}>
          <span className="hero__badge">
            <FaStethoscope className="hero__badge-icon" />
            <span>{tPromo('heroBadge')}</span>
          </span>

          <h1 id="hero-title" className="promo-hero-title promo-heading-display">
            {tPromo('heroTitleBefore')}{' '}
            <em className="hero__em">{tPromo('heroTitleEm')}</em>{' '}
            <span className="hero__after">{tPromo('heroTitleAfter')}</span>
          </h1>

          <p className="promo-hero-subtitle promo-body" id="hero-subtitle">
            {tPromo('heroSubtitle')}
          </p>

          <div className="promo-hero-actions">
            <a
              href={buildPlatformUrl(PLATFORM_URL, { language, theme: themeParam })}
              className="promo-btn promo-btn-primary"
              rel="noopener"
            >
              <FaStethoscope />
              {tPromo('heroLogin')}
            </a>
            <a
              href={buildPlatformUrl(REGISTRO_URL, { language, theme: themeParam })}
              className="promo-btn promo-btn-secondary"
              rel="noopener"
            >
              {tPromo('heroRegister')}
            </a>
            <button
              className="promo-btn promo-btn-whatsapp"
              onClick={handleWhatsApp}
              aria-label={tPromo('navWhatsApp')}
            >
              <FaWhatsapp />
              {tPromo('heroWhatsApp')}
            </button>
          </div>
        </div>
      </div>

      {!heroImage && !imgLoaded && (
        <div className="promo-hero-placeholder">
          <FaStethoscope className="promo-hero-placeholder-icon" />
        </div>
      )}
    </section>
  );
}

export default Hero;
