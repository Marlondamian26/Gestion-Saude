import React from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { CONFIG } from '../config/constants';
import { useInView } from '../hooks/useInView';

function Contacto() {
  const { tPromo } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const contactInfo = CONFIG.contact;

  const contactItems = [
    { icon: <FaMapMarkerAlt />, title: tPromo('contactAddress'), value: contactInfo.address },
    { icon: <FaPhone />, title: tPromo('contactPhone'), value: contactInfo.phone },
    { icon: <FaEnvelope />, title: tPromo('contactEmail'), value: contactInfo.email },
    { icon: <FaClock />, title: tPromo('contactHours'), value: tPromo('contactHours') }
  ];

  return (
    <section
      ref={ref}
      className={`promo-contacto ${isInView ? 'animate-in' : ''}`}
      id="contacto"
    >
      <div className={`promo-section-header ${isInView ? 'animate-fade-up' : ''}`}>
        <span className="promo-section-label">{tPromo('contactTitle')}</span>
        <h2 className="promo-section-title">{tPromo('contactTitle')}</h2>
        <p className="promo-section-subtitle">
          {tPromo('contactSubtitle')}
        </p>
      </div>

      <div className="promo-contacto-grid">
        {contactItems.map((item, index) => (
          <div
            key={index}
            className={`promo-contacto-card ${isInView ? 'animate-fade-up' : ''}`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="promo-contacto-icon">
              {item.icon}
            </div>
            <h3>{item.title}</h3>
            <p>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Contacto;