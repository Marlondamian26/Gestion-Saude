import React from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { CONFIG } from '../config/constants';

function Contacto() {
  const { tPromo } = useLanguage();
  const contactInfo = CONFIG.contact;

  return (
    <section className="promo-contacto" id="contacto">
      <div className="promo-section-header">
        <span className="promo-section-label">{tPromo('contactTitle')}</span>
        <h2 className="promo-section-title">{tPromo('contactTitle')}</h2>
        <p className="promo-section-subtitle">
          {tPromo('contactSubtitle')}
        </p>
      </div>

      <div className="promo-contacto-grid">
        <div className="promo-contacto-card">
          <div className="promo-contacto-icon">
            <FaMapMarkerAlt />
          </div>
          <h3>{tPromo('contactAddress')}</h3>
          <p>{contactInfo.address}</p>
        </div>

        <div className="promo-contacto-card">
          <div className="promo-contacto-icon">
            <FaPhone />
          </div>
          <h3>{tPromo('contactPhone')}</h3>
          <p>{contactInfo.phone}</p>
        </div>

        <div className="promo-contacto-card">
          <div className="promo-contacto-icon">
            <FaEnvelope />
          </div>
          <h3>{tPromo('contactEmail')}</h3>
          <p>{contactInfo.email}</p>
        </div>

        <div className="promo-contacto-card">
          <div className="promo-contacto-icon">
            <FaClock />
          </div>
          <h3>{tPromo('contactHours')}</h3>
          <p>{tPromo('contactHours')}</p>
        </div>
      </div>
    </section>
  );
}

export default Contacto;