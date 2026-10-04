import React, { useEffect, useState, useRef } from 'react';
import { FaStethoscope, FaMapMarkerAlt, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { DOCTOR_NAME, DOCTOR_SPECIALTY, CLINIC_LOCATION, CLINIC_PHONE, PLATFORM_URL, REGISTRO_URL } from '../config/constants';
import { wakeUpBackend } from '../../utils/apiUtils';
import { useInView } from '../hooks/useInView';

const getApiUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');
  }
  const defaultBackend = 'https://gestion-saude-backend.onrender.com/api';
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
    return isLocal ? `${origin}/api` : defaultBackend;
  }
  return defaultBackend;
};

const API_URL = getApiUrl();

const fetchWithTimeout = async (url, options = {}, timeout = 15000, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    } finally {
      clearTimeout(timer);
    }
  }
};

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/sitio/')) return `${API_URL}${path}`;
  if (path.startsWith('/media/')) return `${API_URL}${path}`;
  return `${API_URL}/sitio/${path}`;
};

function Hero() {
  const { tPromo } = useLanguage();
  const [heroImage, setHeroImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [ref, isInView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    let cancelled = false;
    const fetchHeroImage = async () => {
      try {
        setLoadingImage(true);
        await wakeUpBackend();
        const url = `${API_URL}/sitio-imagenes/hero/`;
        const response = await fetchWithTimeout(url, {}, 15000, 3);
        if (!response.ok) return;
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) return;
        const data = await response.json();
        if (!cancelled && data && data.imagen) {
          setHeroImage(data);
        }
      } catch {
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
            <a href={PLATFORM_URL} className="promo-btn promo-btn-primary">
              <FaStethoscope />
              {tPromo('heroLogin')}
            </a>
            <a href={REGISTRO_URL} className="promo-btn promo-btn-secondary">
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
