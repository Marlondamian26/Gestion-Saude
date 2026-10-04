import React from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { CONFIG } from '../config/constants';
import { useInView } from '../hooks/useInView';

function Testimonios() {
  const { tPromo } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const testimonials = CONFIG.testimonials || [];

  const testimonialList = tPromo('testimonials');

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <section
      ref={ref}
      className={`promo-testimonios ${isInView ? 'animate-in' : ''}`}
      id="testimonios"
      role="region"
      aria-labelledby="testimonios-title"
    >
      <div className={`promo-section-header ${isInView ? 'animate-fade-up' : ''}`}>
        <span className="promo-section-label">{tPromo('testimonialsTitle')}</span>
        <h2 id="testimonios-title" className="promo-section-title">{tPromo('testimonialsTitle')}</h2>
        <p className="promo-section-subtitle">
          {tPromo('testimonialsSubtitle')}
        </p>
      </div>

      <div className="promo-testimonios-grid">
        {testimonials.map((testimonio, index) => {
          const transTest = testimonialList?.[index] || testimonio;
          return (
            <div
              key={testimonio.id}
              className={`promo-testimonio-card ${isInView ? 'animate-fade-up' : ''}`}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="promo-testimonio-stars">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className="promo-testimonio-star" />
                ))}
              </div>
              <p className="promo-testimonio-text">"{transTest.text}"</p>
              <div className="promo-testimonio-author">
                <div className="promo-testimonio-avatar">
                  {getInitials(transTest.name)}
                </div>
                <div>
                  <div className="promo-testimonio-name">{transTest.name}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Testimonios;