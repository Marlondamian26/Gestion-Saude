import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FaPause, FaPlay, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
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
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return response;
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const backendOrigin = API_URL.replace(/\/api$/, '');
  if (path.startsWith('/media/')) return `${backendOrigin}${path}`;
  if (path.startsWith('/sitio/')) return `${backendOrigin}${path}`;
  return `${backendOrigin}/media/${path}`;
};

const AUTOPLAY_INTERVAL = 6000;
const PAUSE_DURATION = 10000;

function Carousel() {
  const { tPromo } = useLanguage();
  const prefersReduced = usePrefersReducedMotion();
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const autoPlayRef = useRef(null);
  const pauseRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        setLoading(true);
        await wakeUpBackend();
        const response = await fetchWithTimeout(`${API_URL}/sitio-imagenes/carousel/`, {}, 15000, 3);
        if (!response.ok) {
          setError(tPromo('errorLoading'));
          return;
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setError(tPromo('errorLoading'));
          return;
        }
        const data = await response.json();
        setImages(data);
        setError(null);
      } catch {
        setError(tPromo('connectionError'));
      } finally {
        setLoading(false);
      }
    };
    fetchCarouselImages();
  }, [tPromo]);

  const startAutoplay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (pauseRef.current) clearTimeout(pauseRef.current);
    setIsPlaying(true);
    if (prefersReduced || images.length <= 1) return;
    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, AUTOPLAY_INTERVAL);
  }, [images.length, prefersReduced]);

  const stopAutoplay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setIsPlaying(false);
  }, []);

  const pauseForDuration = useCallback(() => {
    stopAutoplay();
    pauseRef.current = setTimeout(startAutoplay, PAUSE_DURATION);
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    if (prefersReduced || images.length <= 1) return;
    if (isHovered) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (pauseRef.current) clearTimeout(pauseRef.current);
    };
  }, [isHovered, prefersReduced, images.length, startAutoplay, stopAutoplay]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopAutoplay();
      } else if (!isHovered) {
        startAutoplay();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isHovered, startAutoplay, stopAutoplay]);

  const goToPrevious = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    pauseForDuration();
  };

  const goToNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    pauseForDuration();
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    pauseForDuration();
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStart(null);
  };

  if (loading) {
    return (
      <section className="promo-carousel promo-carousel-skeleton" aria-label={tPromo('carouselSectionLabel') || 'Carrusel'}>
        <div className="promo-carousel-skeleton-shimmer" />
        <div className="promo-carousel-dots-skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="promo-carousel-dot promo-carousel-dot-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="promo-carousel promo-carousel-error" aria-label={tPromo('carouselSectionLabel')}>
        <div className="promo-carousel-error-message">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <section
      className="promo-carousel"
      aria-roledescription="carousel"
      aria-label={tPromo('carouselSectionLabel') || 'Imágenes'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      <div className="promo-carousel-container">
        {images.map((img, index) => {
          const imageUrl = getImageUrl(img.imagen);
          const isActive = index === currentIndex;
          return (
            <div
              key={img.id || index}
              className={`promo-carousel-slide ${isActive ? 'active' : ''}`}
              aria-hidden={!isActive}
              role="group"
              aria-roledescription="slide"
              aria-label={`${tPromo('ariaSlideLabel') || 'Slide'} ${index + 1} ${tPromo('of') || 'de'} ${images.length}`}
            >
              <img
                src={imageUrl}
                alt={img.titulo || tPromo('carouselImage')}
                className="promo-carousel-image"
                loading={index === currentIndex ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : undefined}
              />
              <div className="promo-carousel-overlay" />
              {(img.titulo || img.descripcion) && (
                <div className="promo-carousel-caption promo-container-narrow">
                  {img.titulo && <h3 className="promo-carousel-caption-title">{img.titulo}</h3>}
                  {img.descripcion && <p className="promo-carousel-caption-desc">{img.descripcion}</p>}
                </div>
              )}
            </div>
          );
        })}

        {images.length > 1 && (
          <>
            <button
              className="promo-carousel-nav promo-carousel-prev"
              onClick={goToPrevious}
              aria-label={tPromo('ariaNavPrev') || 'Anterior'}
              disabled={prefersReduced}
            >
              <FaChevronLeft />
            </button>

            <button
              className="promo-carousel-nav promo-carousel-next"
              onClick={goToNext}
              aria-label={tPromo('ariaNavNext') || 'Siguiente'}
              disabled={prefersReduced}
            >
              <FaChevronRight />
            </button>

            <div className="promo-carousel-controls">
              {!prefersReduced && (
                <button
                  className="promo-carousel-playpause"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? (tPromo('ariaPauseCarousel') || 'Pausar') : (tPromo('ariaPlayCarousel') || 'Reproducir')}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
              )}
              <div className="promo-carousel-dots" role="tablist">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`promo-carousel-dot ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    role="tab"
                    aria-selected={index === currentIndex}
                    aria-label={`${tPromo('ariaSlideLabel') || 'Slide'} ${index + 1}`}
                    tabIndex={index === currentIndex ? 0 : -1}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Carousel;
