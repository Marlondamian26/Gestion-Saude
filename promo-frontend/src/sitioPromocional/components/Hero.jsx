import React, { useEffect, useState } from 'react';
import { FaStethoscope, FaMapMarkerAlt, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { DOCTOR_NAME, DOCTOR_SPECIALTY, CLINIC_LOCATION, CLINIC_PHONE, PLATFORM_URL, REGISTRO_URL, buildPlatformUrl } from '../config/constants';
import { API_URL, wakeUpBackend, fetchWithRetry, getImageUrl } from '../../utils/apiUtils';
import { useInView } from '../hooks/useInView';

function Hero() {
  const { tPromo, language } = useLanguage();
  const { theme, isAutomatic } = useTheme();
  const [heroImage, setHeroImage] = useState(null);
  const [, setLoadingImage] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [ref, isInView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    let cancelled = false;
    const fetchHeroImage = async () => {
      try {
        setLoadingImage(true);
        await wakeUpBackend();
        const url = `${API_URL}/sitio-imagenes/hero/`;
        const response = await fetchWithRetry(url, {}, 3, 15000);
        if (!response.ok) {
          if (import.meta.env.DEV) console.error('[Hero] API returned', response.status);
          return;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          if (import.meta.env.DEV) console.error('[Hero] Response not JSON:', contentType);
          return;
        }
        const data = await response.json();
        if (!cancelled && data && data.imagen) {
          setHeroImage(data);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('[Hero] fetch failed:', err.message);
      } finally {
        if (!cancelled) setLoadingImage(false);
      }
    };
    fetchHeroImage();
    return () => { cancelled = true; };
  }, []);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_PHONE.replace(/\s/g, '')}`, '_blank');
  };

  const themeParam = isAutomatic ? 'auto' : theme;
  const heroImageClasses = `promo-hero-image ${imgLoaded ? 'loaded' : 'loading'} ${isInView ? 'in-view' : ''}`;

  return (
    <section
      ref={ref}
      className={`promo-hero ${isInView ? 'animate-in' : ''}`}
    >
      <div className="promo-hero-bg-gradient" />
      <div className="promo-hero-dots" />

      <div className="promo-hero-content">
        <div className={`promo-hero-text ${isInView ? 'animate-fade-up' : ''}`}>
          <div className="promo-hero-badge">
            <span>{tPromo('heroBadge')}</span>
          </div>

          <h1>
            {tPromo('heroTitle')}
          </h1>

          <p className="promo-hero-subtitle">
            {tPromo('heroSubtitle')}
          </p>

          <div className="promo-hero-buttons">
            <a href={buildPlatformUrl(PLATFORM_URL, { language, theme: themeParam })} className="promo-btn promo-btn-primary" rel="noopener">
              <FaStethoscope />
              {tPromo('heroLogin')}
            </a>
            <a href={buildPlatformUrl(REGISTRO_URL, { language, theme: themeParam })} className="promo-btn promo-btn-secondary" rel="noopener">
              <FaArrowRight />
              {tPromo('heroRegister')}
            </a>
            <button className="promo-btn promo-btn-secondary" onClick={handleWhatsApp}>
              <FaWhatsapp />
              {tPromo('heroWhatsApp')}
            </button>
          </div>
        </div>

        <div className={heroImageClasses}>
          {heroImage ? (
            <>
              <div className="promo-hero-card promo-hero-card-image">
                <img
                  src={getImageUrl(heroImage.imagen)}
                  alt={heroImage.titulo || tPromo('carouselImage')}
                  className="promo-hero-img"
                  onLoad={() => setImgLoaded(true)}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                />
                <div className="promo-hero-img-overlay">
                  <h3>{heroImage.titulo}</h3>
                  {heroImage.descripcion && <p>{heroImage.descripcion}</p>}
                </div>
              </div>
            </>
          ) : (
            <div className="promo-hero-card promo-hero-card-placeholder">
              <div className="promo-hero-doctor">
                <div className="promo-doctor-avatar">
                  <FaStethoscope />
                </div>
                <div className="promo-doctor-info">
                  <h3>{DOCTOR_NAME}</h3>
                  <p className="promo-doctor-specialty">{DOCTOR_SPECIALTY}</p>
                  <p className="promo-doctor-location">
                    <FaMapMarkerAlt />
                    {CLINIC_LOCATION}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Hero;
