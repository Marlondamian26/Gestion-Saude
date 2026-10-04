import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaCircle } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
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
      console.log(`[Carousel] Attempt ${attempt + 1}/${retries + 1} fetching:`, url);
      const response = await fetch(url, { ...options, signal: controller.signal });
      console.log(`[Carousel] Attempt ${attempt + 1} success, status:`, response.status);
      return response;
    } catch (err) {
      console.warn(`[Carousel] Attempt ${attempt + 1} failed:`, err.message);
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
  if (path.startsWith('/sitio/')) return `${API_URL}${path}`;
  if (path.startsWith('/media/')) return `${API_URL}${path}`;
  return `${API_URL}/sitio/${path}`;
};

function Carousel() {
  const { tPromo } = useLanguage();
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCarouselImages();
  }, []);

  const fetchCarouselImages = async () => {
    try {
      setLoading(true);
      
      // Despertar el backend antes de hacer la petición
      await wakeUpBackend();
      
      const url = `${API_URL}/sitio-imagenes/carousel/`;
      
      const response = await fetchWithTimeout(url, {}, 15000, 3); // 15s timeout, 3 retries
      
      if (!response.ok) {
        console.error('[Carousel] Response not ok:', response.status, response.statusText);
        setError(tPromo('errorLoading'));
        return;
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[Carousel] Invalid content-type:', contentType);
        setError(tPromo('errorLoading'));
        return;
      }
      
      const data = await response.json();
      console.log('[Carousel] Received data:', data);
      setImages(data);
      setError(null);
    } catch (err) {
      console.error('[Carousel] Fetch error after retries:', err);
      setError(tPromo('connectionError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <section className="promo-carousel">
        <div className="promo-carousel-loading">
          <div className="promo-carousel-spinner"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="promo-carousel promo-carousel-error">
        <div className="promo-carousel-error-message">
          <p>{tPromo('errorLoading')}</p>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return (
      <section className="promo-carousel promo-carousel-empty">
        <div className="promo-carousel-empty-message">
          <p>{tPromo('noDataAvailable')}</p>
        </div>
      </section>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <section className="promo-carousel">
      <div className="promo-carousel-container">
        <div className="promo-carousel-slide">
          <img 
            src={getImageUrl(currentImage.imagen)} 
            alt={currentImage.titulo || 'Carousel image'} 
            className="promo-carousel-image"
            loading="lazy"
            decoding="async"
          />
          {currentImage.titulo && (
            <div className="promo-carousel-caption">
              <h3>{currentImage.titulo}</h3>
              {currentImage.descripcion && <p>{currentImage.descripcion}</p>}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <>
            <button 
              className="promo-carousel-arrow promo-carousel-prev" 
              onClick={goToPrevious}
              aria-label="Previous slide"
            >
              <FaChevronLeft />
            </button>
            
            <button 
              className="promo-carousel-arrow promo-carousel-next" 
              onClick={goToNext}
              aria-label="Next slide"
            >
              <FaChevronRight />
            </button>

            <div className="promo-carousel-dots">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`promo-carousel-dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <FaCircle />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Carousel;