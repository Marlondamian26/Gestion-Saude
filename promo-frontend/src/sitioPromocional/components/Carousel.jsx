import React, { useEffect, useState, useRef, useCallback } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
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
      return response;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    } finally {
      clearTimeout(timer);
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

const AUTOPLAY_INTERVAL = 5000;
const PAUSE_DURATION = 8000;

function Carousel() {
  const { tPromo } = useLanguage();
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const autoPlayRef = useRef(null);
  const pauseRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const fetchCarouselImages = useCallback(async () => {
    try {
      setLoading(true);
      await wakeUpBackend();
      const url = `${API_URL}/sitio-imagenes/carousel/`;
      const response = await fetchWithTimeout(url, {}, 15000, 3);
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
  }, [tPromo]);

  useEffect(() => {
    fetchCarouselImages();
  }, [fetchCarouselImages]);

  const startAutoplay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (pauseRef.current) clearTimeout(pauseRef.current);
    setIsPlaying(true);
    autoPlayRef.current = setInterval(() => {
      if (images.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
    }, AUTOPLAY_INTERVAL);
  }, [images.length]);

  const stopAutoplay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    setIsPlaying(false);
  }, []);

  const pauseForDuration = useCallback(() => {
    stopAutoplay();
    pauseRef.current = setTimeout(startAutoplay, PAUSE_DURATION);
  }, [startAutoplay, stopAutoplay]);

  useEffect(() => {
    if (reducedMotion || images.length <= 1) return;
    if (isHovered) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      if (pauseRef.current) clearTimeout(pauseRef.current);
    };
  }, [isHovered, reducedMotion, images.length, startAutoplay, stopAutoplay]);

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

  if (loading) {
    return (
      <section className="promo-carousel promo-carousel-skeleton">
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
      <section className="promo-carousel promo-carousel-error">
        <div className="promo-carousel-error-message">
          <p>{error}</p>
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

  return (
    <section
      className="promo-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="promo-carousel-container">
        {images.map((img, index) => {
          const imageUrl = getImageUrl(img.imagen);
          const isActive = index === currentIndex;
          const isPrev = index === (currentIndex - 1 + images.length) % images.length;

          return (
            <div
              key={img.id || index}
              className={`promo-carousel-slide ${isActive ? 'active' : isPrev ? 'prev' : ''}`}
              aria-hidden={!isActive}
            >
              <img
                src={imageUrl}
                alt={img.titulo || tPromo('carouselImage')}
                className="promo-carousel-image"
                loading={index === currentIndex ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : undefined}
              />
              {img.titulo && (
                <div className="promo-carousel-caption">
                  <h3>{img.titulo}</h3>
                  {img.descripcion && <p>{img.descripcion}</p>}
                </div>
              )}
            </div>
          );
        })}

        {images.length > 1 && (
          <>
            <button
              className="promo-carousel-arrow promo-carousel-prev"
              onClick={goToPrevious}
              aria-label={tPromo('prevSlide') || 'Previous slide'}
              disabled={reducedMotion}
            >
              ◀
            </button>

            <button
              className="promo-carousel-arrow promo-carousel-next"
              onClick={goToNext}
              aria-label={tPromo('nextSlide') || 'Next slide'}
              disabled={reducedMotion}
            >
              ▶
            </button>

            <div className="promo-carousel-controls">
              {!reducedMotion && (
                <button
                  className="promo-carousel-playpause"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
              )}
              <div className="promo-carousel-dots">
                {images.map((_, index) => (
                  <button
                    key={index}
                    className={`promo-carousel-dot ${index === currentIndex ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={index === currentIndex}
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
