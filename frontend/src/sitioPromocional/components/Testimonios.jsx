import React from 'react';
import { FaStar } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { CONFIG } from '../config/constants';

function Testimonios() {
  const { tPromo } = useLanguage();
  const testimonials = CONFIG.testimonials || [];

  const testimonialList = tPromo('testimonials');

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <section className="promo-testimonios" id="testimonios">
      <div className="promo-section-header">
        <span className="promo-section-label">{tPromo('testimonialsTitle')}</span>
        <h2 className="promo-section-title">{tPromo('testimonialsTitle')}</h2>
        <p className="promo-section-subtitle">
          {tPromo('testimonialsTitle')}
        </p>
      </div>
      
      <div className="promo-testimonios-grid">
        {testimonials.map((testimonio, index) => {
          const transTest = testimonialList?.[index] || testimonio;
          return (
            <div key={testimonio.id} className="promo-testimonio-card">
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