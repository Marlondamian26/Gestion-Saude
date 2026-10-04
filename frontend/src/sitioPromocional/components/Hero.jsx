import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStethoscope, FaHeart, FaMapMarkerAlt, FaArrowRight, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { DOCTOR_NAME, DOCTOR_SPECIALTY, CLINIC_LOCATION, CLINIC_PHONE, PLATFORM_URL, REGISTRO_URL } from '../config/constants';
import { wakeUpBackend } from '../../utils/apiUtils';

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

const fetchWithTimeout = async (url, options = {}, timeout = 30000, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    
    try {
      console.log(`[Hero] Attempt ${attempt + 1}/${retries + 1} fetching:`, url);
      const response = await fetch(url, { ...options, signal: controller.signal });
      console.log(`[Hero] Attempt ${attempt + 1} success, status:`, response.status);
      return response;
    } catch (err) {
      console.warn(`[Hero] Attempt ${attempt + 1} failed:`, err.message);
      if (attempt === retries) {
        throw err;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    } finally {
      clearTimeout(timer);
    }
  }
};

// Helper to get full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Handle different path patterns
  if (path.startsWith('/sitio/')) return `${API_URL}${path}`;
  if (path.startsWith('/media/')) return `${API_URL}${path}`;
  return `${API_URL}/sitio/${path}`;
};

function Hero() {
  const { tPromo, language } = useLanguage();
  const [heroImage, setHeroImage] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);

  useEffect(() => {
    fetchHeroImage();
  }, []);

  const fetchHeroImage = async () => {
    try {
      setLoadingImage(true);
      
      // Despertar el backend antes de hacer la petición
      await wakeUpBackend();
      
      const url = `${API_URL}/sitio-imagenes/hero/`;
      
      const response = await fetchWithTimeout(url, {}, 15000, 3); // 15s timeout, 3 retries
      
      if (!response.ok) {
        console.error('[Hero] Response not ok:', response.status, response.statusText);
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[Hero] Invalid content-type:', contentType);
        return;
      }
      
      const data = await response.json();
      console.log('[Hero] Received data:', data);
      if (data && data.imagen) {
        setHeroImage(data);
      }
    } catch (err) {
      console.error('[Hero] Fetch error after retries:', err);
      // Don't show error to user, just log it
    } finally {
      setLoadingImage(false);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_PHONE.replace(/\s/g, '')}`, '_blank');
  };

  return (
    <section className="promo-hero">
      <div className="promo-hero-content">
        <div className="promo-hero-text">
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
        
        <div className="promo-hero-image">
          {loadingImage ? (
            <div className="promo-hero-card">
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
          ) : heroImage ? (
            <div className="promo-hero-card promo-hero-card-image">
              <img 
                src={getImageUrl(heroImage.imagen)} 
                alt={heroImage.titulo || 'Hero image'} 
                className="promo-hero-img"
                fetchPriority="high"
                loading="eager"
                decoding="async"
              />
              {heroImage.titulo && (
                <div className="promo-hero-img-overlay">
                  <h3>{heroImage.titulo}</h3>
                  {heroImage.descripcion && <p>{heroImage.descripcion}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="promo-hero-card">
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